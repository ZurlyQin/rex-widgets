const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(process.argv[2] || require('node:path').join(__dirname, 'tmdb-movie-collections.js'), 'utf8');
const today = '2026-10-29';
const makeMovie = (id, lang, day, score=8) => ({id,title:'Movie '+id,original_title:'Original '+id,original_language:lang,release_date:day,vote_average:score,vote_count:1000,poster_path:'/poster.jpg',backdrop_path:'/back.jpg',overview:'Overview',adult:false});
const records=[];
for (let i=0;i<65;i++) records.push(makeMovie(i+1, i%3===0?'cn':'zh',new Date(Date.UTC(2026,9,28-i)).toISOString().slice(0,10),9-i/100));
for (let i=0;i<67;i++) records.push(makeMovie(i+101,i%2?'fr':'en',new Date(Date.UTC(2026,9,28-i)).toISOString().slice(0,10),9.2-i/100));
records.push(makeMovie(900,'xx','2026-10-28'),makeMovie(901,'zh','2099-01-01'),{...makeMovie(902,'cn',today),vote_count:1},{...makeMovie(903,'en',today),adult:true});
function setup(opts={}) {
 const calls=[]; const storage={};
 const context=vm.createContext({console:{log(){},error(){}},Date:class extends Date {static now(){return Date.parse(today+'T04:00:00Z');}},Widget:{storage:opts.noStorage?undefined:{get:k=>storage[k],set:(k,v)=>storage[k]=v},tmdb:{get:async(path,{params:q})=>{
   calls.push({path,q}); if(opts.fail) throw new Error('network failure');
   if(opts.malformed)return {data:{results:[]}};
   let list=(opts.records||records).filter(m=>(!q.with_original_language||m.original_language===q.with_original_language)&&(!q.with_origin_country||m.id<=65));
   // Emulate real server filtering but deliberately let invalid rows pass through to exercise defenses.
   list.sort((a,b)=>q.sort_by==='primary_release_date.desc'?b.release_date.localeCompare(a.release_date):b.vote_average-a.vote_average);
   return {page:q.page,total_pages:Math.ceil(list.length/20),results:list.slice((q.page-1)*20,q.page*20)};
 }}}});
 vm.runInContext(source,context); return {context,calls,storage};
}
const ids = list => Array.from(list,m=>m.id);
(async()=>{
 let s=setup(); assert.equal(s.context.WidgetMetadata.modules.length,5);
 for(const mod of s.context.WidgetMetadata.modules){assert.equal(typeof s.context[mod.functionName],'function');assert(mod.params.some(p=>p.name==='page'&&p.type==='page'));}
 const a=await s.context.latestChinese({page:1}), b=await s.context.latestChinese({page:2}), c=await s.context.latestChinese({page:3}),d=await s.context.latestChinese({page:4});
 assert.deepEqual(ids([...a,...b,...c,...d]),Array.from({length:65},(_,i)=>i+1));
 assert.equal(a[0].type,'tmdb'); assert.equal(a[0].mediaType,'movie');assert.equal(typeof a[0].id,'number');assert.equal(a[0].posterPath,'/poster.jpg');assert.equal(a[0].backdropPath,'/back.jpg');assert.equal(a[0].poster_path,undefined);assert.equal(a[0].link,undefined);
 const calls=s.calls.length; assert.deepEqual(ids(await s.context.latestChinese({page:2})),ids(b));assert.equal(s.calls.length,calls);
 assert.equal((await s.context.latestChinese({page:5})).length,0);
 assert(s.calls.every(c=>c.path==='discover/movie'&&c.q.include_adult===false&&c.q['primary_release_date.lte']===today));
 assert(s.calls.some(c=>c.q.with_original_language==='cn'));assert(s.calls.some(c=>c.q.with_original_language==='zh'));
 s=setup();const foreign=[];for(let p=1;p<=4;p++)foreign.push(...await s.context.latestForeign({page:p}));
 assert.equal(foreign.length,67);assert.deepEqual(ids(foreign),Array.from({length:67},(_,i)=>101+i));
 for(const fn of ['topChinese','topHongKong','topForeign']){
  s=setup();const first=await s.context[fn]({page:1});const second=await s.context[fn]({page:2});
  assert.equal(first.length,20);assert.equal(second.length,20);assert.equal(new Set(ids([...first,...second])).size,40);
  for(let i=1;i<40;i++)assert([...first,...second][i-1].rating >= [...first,...second][i].rating);
  assert.equal(s.calls[0].q.sort_by,'vote_average.desc');assert.equal(s.calls[0].q['vote_average.gte'],7);
  assert.equal(s.calls[0].q['vote_count.gte'],fn==='topForeign'?500:100);
  if(fn==='topHongKong')assert.equal(s.calls[0].q.with_origin_country,'HK');
 }
 s=setup();await s.context.topChinese({page:1});await s.context.topChinese({page:1,minRating:'8.5',minVotes:'300',language:'zh-TW',genreId:18,peopleId:1});
 const q=s.calls.at(-1).q;assert.equal(q['vote_average.gte'],8.5);assert.equal(q['vote_count.gte'],300);assert.equal(q.language,'zh-TW');assert.equal(q.with_genres,'18');assert.equal(q.with_people,'1');
 s=setup();await assert.rejects(()=>s.context.latestChinese({page:0}));await assert.rejects(()=>s.context.latestChinese({page:1.5}));await assert.rejects(()=>s.context.latestChinese({page:501}));assert.equal(s.calls.length,0);
 s=setup({malformed:true});await assert.rejects(()=>s.context.latestForeign({}));assert.equal(Object.keys(s.storage).length,0);
 s=setup({fail:true});await assert.rejects(()=>s.context.topHongKong({}),/network failure/);
 s=setup({noStorage:true});assert.deepEqual(ids(await s.context.latestChinese({page:3})),Array.from({length:20},(_,i)=>i+41));
 s=setup({records:[]});assert.equal((await s.context.topForeign({})).length,0);
 s=setup({records:Array.from({length:41},(_,i)=>makeMovie(1,'en','2026-10-01'))});assert.equal((await s.context.latestForeign({})).length,1);
 console.log('PASS: five categories; request filters; multi-page merge; foreign page refill; deduplication; cache; custom filters; output fields; empty/error paths; invalid pages; no-storage jump.');
})().catch(e=>{console.error(e);process.exit(1)});
