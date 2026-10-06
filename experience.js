const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let stage=0,currentTrack=0,appearance='dark',design='subway',sound=false,audioContext=null,dragStart=null,suppressClick=false;
const stages=['sealed','open','out'];
const tracks=[
 {category:'Share across music apps',title:['Your song.', 'Their music app.'],description:'Send one Smart Link. They open the song on Apple Music, Spotify, TIDAL, or YouTube Music—even without TuneTransit.',asset:'song',ribbon:'Share',noteLabel:'No more “I don’t use Spotify”',note:'Your recommendation stays the same. Your friend chooses where to listen, without searching for the song again.'},
 {category:'Find a song to share',title:['A link, a name,', 'or what’s playing.'],description:'Paste a music link, search a song or artist, or use Live Capture. TuneTransit finds the song so you can share it across services.',asset:'search',ribbon:'Find',noteLabel:'Start wherever the music finds you',note:'You don’t need to know which service your friend uses before you send them something.'},
 {category:'Keep your recommendations',title:['Find that song', 'they sent you.'],description:'Tracks keeps your sent and received songs together. Revisit a recommendation and follow the replies in Arrivals and Departures.',asset:'tracks',ribbon:'Remember',noteLabel:'A place for the music between you',note:'Come back to a song you shared, see its activity, or pick up the conversation with another recommendation.'},
 {category:'Discover through other listeners',title:['Hear what people', 'are passing on.'],description:'The Station Board shows the week’s most-shared songs and recent activity. Find something new through the music people recommend.',asset:'station-board',ribbon:'Discover',noteLabel:'Your next recommendation starts here',note:'See what’s moving through TuneTransit, then pass along something that catches your ear.'},
 {category:'Make a personal mixtape',title:['When one song', 'isn’t enough.'],description:'Collect songs into a mixtape, put them in order, and add a personal note. Share a whole feeling with someone.',asset:'mixtape-detail',ribbon:'Make',noteLabel:'For a person, a moment, a long drive',note:'A mixtape gives a few songs a reason to belong together. The title and note make it yours.'},
 {category:'Share to your story · Premium',title:['Give your song', 'a cover worth sharing.'],description:'Turn a song into a Story Card for social sharing. Pick one of five designs and export it straight from TuneTransit.',asset:'story',ribbon:'Post',noteLabel:'Made for the song you want everyone to hear',note:'Subway, The Paper, Pulse, Sunset Club, and After Dark are actual TuneTransit exports. Story Cards require Premium.'}
];
function clickSound(open=false){if(!sound)return;try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='triangle';o.frequency.setValueAtTime(open?190:340,audioContext.currentTime);o.frequency.exponentialRampToValueAtTime(65,audioContext.currentTime+.07);g.gain.setValueAtTime(.06,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.09);o.connect(g).connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+.1);}catch{}}
function setStage(next){stage=Math.max(0,Math.min(2,next));if(stage===2)$('#liner').hidden=false;document.body.dataset.stage=stages[stage];$('#reset-button').hidden=stage===0;$('#open-label').textContent=['Open the case','Take out the tape','Explore TuneTransit'][stage];$('#step-count').textContent=['A little something for you','There’s more inside','What will you share?'][stage];$('#gesture-note').textContent=['Open it to explore TuneTransit.','Take it out to explore the app.','See what TuneTransit can do for you.'][stage];$('#tape-object').setAttribute('aria-label',['Open the mixtape case','Take the cassette out of the case','Explore TuneTransit'][stage]);$('#stage-status').textContent=['The mixtape is back in its case.','The case is open. Take out the tape.','The tape is out. The TuneTransit feature guide is ready.'][stage];if(stage<2)$('#liner').hidden=true;clickSound(true);if(stage===2&&matchMedia('(max-width:700px)').matches)requestAnimationFrame(()=>$('#liner').scrollIntoView({behavior:motion.matches?'auto':'smooth',block:'start'}));if(stage===2&&!motion.matches)$('#liner').animate([{opacity:0,transform:'translateY(35px) rotate(5deg)'},{opacity:1,transform:'translateY(0) rotate(2deg)'}],{duration:900,easing:'cubic-bezier(.22,1,.36,1)'});}
function advance(){if(stage<2)setStage(stage+1);else{if(matchMedia('(max-width:700px)').matches)$('#liner').scrollIntoView({behavior:motion.matches?'auto':'smooth',block:'center'});$('#liner-start')?.focus();}}
$('#open-button').addEventListener('click',advance);$('#tape-object').addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}advance();});$('#reset-button').addEventListener('click',()=>{setStage(0);window.scrollTo({top:0,behavior:'auto'});$('#open-button').focus();});
const tape=$('#tape-object');
tape.addEventListener('pointerdown',e=>{if(stage===2)return;dragStart={x:e.clientX,y:e.clientY};tape.setPointerCapture(e.pointerId);});
tape.addEventListener('pointermove',e=>{if(!dragStart)return;const lift=Math.max(0,dragStart.y-e.clientY);if(lift>5){document.body.classList.add('is-dragging');document.body.style.setProperty('--drag-angle',`${Math.min(145,lift*1.1)}deg`);document.body.style.setProperty('--drag-tape',`${-5-Math.min(35,lift*.2)}%`);}});
tape.addEventListener('pointerup',e=>{const lifted=dragStart&&dragStart.y-e.clientY>35;document.body.classList.remove('is-dragging');dragStart=null;if(lifted){suppressClick=true;setStage(Math.min(stage+1,2));}});
tape.addEventListener('pointercancel',()=>{dragStart=null;document.body.classList.remove('is-dragging');});
$('#sound-button').addEventListener('click',()=>{sound=!sound;$('#sound-button').setAttribute('aria-pressed',String(sound));$('#sound-button').textContent=sound?'Sound on':'Sound off';clickSound();});
const player=$('#track-player');
function screenPath(index=currentTrack){return index===5?`assets/native/native-story-${design}.jpg`:`assets/native/native-${tracks[index].asset}-${appearance}.jpg`;}
function preloadScreen(index){if(index<0||index>5)return;const image=new Image();image.decoding='async';image.src=screenPath(index);}
function renderTrack(){
 const end=currentTrack===6,t=tracks[currentTrack];
 player.dataset.page=String(currentTrack);player.dataset.feature=end?'end':currentTrack===5?'story':t.asset.split('-')[0];player.dataset.kind=end?'end':currentTrack===5?'story':'app';
 $('.player-layout').hidden=end;$('.booklet-ribbon').hidden=end;$('#last-page').hidden=!end;
 if(end){$('#player-count').textContent='';$('#player-count').hidden=true;}else{$('#player-count').textContent=`${currentTrack+1} OF 6`;$('#player-count').hidden=false;}
 $('#previous-track').disabled=currentTrack===0;
 $('#previous-track').textContent='Prev';
 $('#next-track').disabled=false;
 $('#next-track').textContent=end?'Premium →':currentTrack===5?'Get app →':'Next →';
 $('#close-player').textContent='Close';
 $$('#track-buttons button').forEach((b,i)=>{if(i===currentTrack)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
 player.classList.remove('zoomed');$('#zoom-screen').setAttribute('aria-pressed','false');$('#zoom-screen').setAttribute('aria-label','Enlarge app screen');
 player.setAttribute('aria-labelledby',end?'last-title':'track-title');
 if(end)return;
 $('#chapter-number').textContent=String(currentTrack+1).padStart(2,'0');$('#ribbon-title').textContent=t.ribbon;
 $('#screen-label').textContent=t.category;
 $('#track-category').textContent=t.category;$('#track-title').replaceChildren(document.createTextNode(t.title[0]),document.createElement('br'),document.createTextNode(' '+t.title[1]));
 $('#track-description').textContent=t.description;
 const access=['3 free searches/day · unlimited with Premium','3 free song/album searches/day','Included with TuneTransit','Included with TuneTransit','Premium: up to 500 songs + custom designs','TuneTransit Premium required'];
 $('#feature-access').replaceChildren(document.createTextNode(access[currentTrack]+' '));
 if([0,1,4,5].includes(currentTrack)){const link=document.createElement('a');link.href='premium.html';link.textContent='See Premium →';$('#feature-access').append(link);}
 if($('#track-note'))$('#track-note').textContent=t.note;if($('#note-label'))$('#note-label').textContent=t.noteLabel;
 $('#native-image').src=screenPath();$('#native-image').alt=currentTrack===5?`TuneTransit’s ${design} Story Card export`:`TuneTransit’s actual ${t.category} interface`;
 $('#native-caption').textContent=currentTrack===5?'An original TuneTransit export · enlarge ↗':'From TuneTransit 3.0 · example music · enlarge ↗';
 preloadScreen(currentTrack+1);
 $('#appearance').hidden=currentTrack===5;$('#story-choices').hidden=currentTrack!==5;
 if(!motion.matches)$('.player-layout').animate([{opacity:.25,transform:'translateX(14px)'},{opacity:1,transform:'translateX(0)'}],{duration:350,easing:'ease-out'});
}
let pushedTour=false;
function playTrack(index){currentTrack=index;renderTrack();if(!player.open){player.showModal();document.body.classList.add('modal-open');if(location.hash!=='#tour'){history.pushState({tour:true},'','#tour');pushedTour=true;}}player.scrollTo({top:0});$('.player-layout')?.scrollTo({top:0});$('#last-page')?.scrollTo({top:0});$('.player-copy')?.scrollTo({top:0});clickSound();}
$$('[data-track]').forEach(b=>b.addEventListener('click',()=>playTrack(Number(b.dataset.track))));// Closing the tour clears #tour, so the browser's Back button closes the tour instead of leaving the site.
function tourClosed(){document.body.classList.remove('modal-open');if(location.hash==='#tour'){const pushed=pushedTour;pushedTour=false;if(pushed)history.back();else history.replaceState(null,'',location.pathname+location.search);}}
$('#close-player').addEventListener('click',()=>{player.close();tourClosed();});player.addEventListener('close',tourClosed);
$('#previous-track').addEventListener('click',()=>playTrack(Math.max(0,currentTrack-1)));$('#next-track').addEventListener('click',()=>{if(currentTrack===6){location.href='premium.html';return;}playTrack(Math.min(6,currentTrack+1));});
$$('[data-appearance]').forEach(b=>b.addEventListener('click',()=>{appearance=b.dataset.appearance;$$('[data-appearance]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#native-image').src=screenPath();}));$$('[data-design]').forEach(b=>b.addEventListener('click',()=>{design=b.dataset.design;$$('[data-design]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#native-image').src=screenPath();$('#native-image').alt=`TuneTransit’s ${b.textContent} Story Card export`;clickSound();}));$('#zoom-screen').addEventListener('click',()=>{const zoom=player.classList.toggle('zoomed');$('#zoom-screen').setAttribute('aria-pressed',String(zoom));$('#zoom-screen').setAttribute('aria-label',zoom?'Reduce app screen':'Enlarge app screen');});
$('#about-button').addEventListener('click',()=>$('#about-dialog').showModal());$('#close-about').addEventListener('click',()=>$('#about-dialog').close());
for(const dialog of $$('dialog'))dialog.addEventListener('click',e=>{if(e.target===dialog&&dialog.id==='about-dialog'){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});

player.addEventListener('keydown',e=>{if(e.target.closest('button,a,summary')&&e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;if(e.key==='ArrowRight'&&currentTrack<6){e.preventDefault();playTrack(currentTrack+1);}if(e.key==='ArrowLeft'&&currentTrack>0){e.preventDefault();playTrack(currentTrack-1);}});

window.addEventListener('resize',()=>{if(player.open)renderTrack();});
let touchStartX=0,touchStartY=0;
player.addEventListener('touchstart',e=>{touchStartX=e.changedTouches[0].screenX;touchStartY=e.changedTouches[0].screenY;},{passive:true});
player.addEventListener('touchend',e=>{const dx=e.changedTouches[0].screenX-touchStartX,dy=e.changedTouches[0].screenY-touchStartY;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5){if(dx<0&&currentTrack<6)playTrack(currentTrack+1);else if(dx>0&&currentTrack>0)playTrack(currentTrack-1);}},{passive:true});

function checkTourHash(){if(location.hash==='#tour'){if(!player.open)playTrack(0);}else if(player.open){pushedTour=false;player.close();}}
window.addEventListener('hashchange',checkTourHash);window.addEventListener('popstate',checkTourHash);
checkTourHash();
