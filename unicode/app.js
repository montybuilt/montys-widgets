const input = document.querySelector('#character-input');
const encodingSelect = document.querySelector('#encoding-select');
const bomToggle = document.querySelector('#bom-toggle');
const fullscreenToggle = document.querySelector('#fullscreen-toggle');
const widget = document.querySelector('.widget');

const commonNames = new Map([
  [0x41,'LATIN CAPITAL LETTER A'],[0x65,'LATIN SMALL LETTER E'],[0xE9,'LATIN SMALL LETTER E WITH ACUTE'],
  [0x301,'COMBINING ACUTE ACCENT'],[0x4E2D,'CJK UNIFIED IDEOGRAPH-4E2D'],
  [0x3042,'HIRAGANA LETTER A'],[0xD55C,'HANGUL SYLLABLE HAN'],[0x416,'CYRILLIC CAPITAL LETTER ZHE'],[0x3A9,'GREEK CAPITAL LETTER OMEGA'],[0x1F600,'GRINNING FACE'],
  [0x1F469,'WOMAN'],[0x200D,'ZERO WIDTH JOINER'],[0x1F4BB,'PERSONAL COMPUTER']
]);

const encodingInfo = {
  utf8:{label:'UTF-8',bom:[0xEF,0xBB,0xBF],bomText:'UTF-8 has no byte-order ambiguity. Its BOM is permitted but usually omitted.'},
  utf16le:{label:'UTF-16 LE',bom:[0xFF,0xFE],bomText:'FF FE identifies a UTF-16 stream whose code units are stored least-significant byte first.'},
  utf16be:{label:'UTF-16 BE',bom:[0xFE,0xFF],bomText:'FE FF identifies a UTF-16 stream whose code units are stored most-significant byte first.'},
  utf32le:{label:'UTF-32 LE',bom:[0xFF,0xFE,0x00,0x00],bomText:'FF FE 00 00 identifies little-endian UTF-32.'},
  utf32be:{label:'UTF-32 BE',bom:[0x00,0x00,0xFE,0xFF],bomText:'00 00 FE FF identifies big-endian UTF-32.'}
};

function firstGrapheme(text){
  if(!text) return 'A';
  if(Intl.Segmenter){return [...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text)][0].segment;}
  return String.fromCodePoint(text.codePointAt(0));
}
function hex(n,width=2){return n.toString(16).toUpperCase().padStart(width,'0')}
function cpName(cp){return commonNames.get(cp)||(cp>=0x1F300&&cp<=0x1FAFF?'EMOJI / SYMBOL':cp>=0x4E00&&cp<=0x9FFF?`CJK UNIFIED IDEOGRAPH-${hex(cp,4)}`:'UNICODE CHARACTER')}
function byteBits(byte,types){return Array.from({length:8},(_,i)=>({value:(byte>>(7-i))&1,type:types?.[i]||'payload'}))}

function utf8Unit(cp){
  let bytes, markers;
  if(cp<=0x7F){bytes=[cp];markers=[1]}
  else if(cp<=0x7FF){bytes=[0xC0|(cp>>6),0x80|(cp&63)];markers=[3,2]}
  else if(cp<=0xFFFF){bytes=[0xE0|(cp>>12),0x80|((cp>>6)&63),0x80|(cp&63)];markers=[4,2,2]}
  else{bytes=[0xF0|(cp>>18),0x80|((cp>>12)&63),0x80|((cp>>6)&63),0x80|(cp&63)];markers=[5,2,2,2]}
  return bytes.map((b,i)=>({byte:b,bits:byteBits(b,Array(8).fill('payload').map((x,j)=>j<markers[i]?'marker':x)),caption:i?'continuation byte':'leading byte'}));
}
function utf16Units(cp,little){
  const words=cp<=0xFFFF?[cp]:[0xD800+((cp-0x10000)>>10),0xDC00+((cp-0x10000)&0x3FF)];
  return words.flatMap((word,wi)=>{
    const pair=[word>>8,word&255]; if(little) pair.reverse();
    return pair.map((b,bi)=>({byte:b,bits:byteBits(b),caption:`${words.length>1?(wi?'low':'high')+' surrogate · ':''}${little?(bi?'high':'low'):(bi?'low':'high')} byte`}));
  });
}
function utf32Units(cp,little){
  const bytes=[(cp>>>24)&255,(cp>>>16)&255,(cp>>>8)&255,cp&255]; if(little) bytes.reverse();
  return bytes.map((b,i)=>({byte:b,bits:byteBits(b),caption:`byte ${i+1} · ${little?'little':'big'} endian`}));
}
function encode(cp,kind){
  if(kind==='utf8') return utf8Unit(cp);
  if(kind.startsWith('utf16')) return utf16Units(cp,kind.endsWith('le'));
  return utf32Units(cp,kind.endsWith('le'));
}
function bitsHTML(bits){return `<div class="bits">${bits.map(b=>`<span class="bit ${b.type} ${b.value?'':'zero'}">${b.value}</span>`).join('')}</div>`}
function rulePattern(pattern){
  const bytes=pattern.split(' ');
  return `<div class="rule-pattern">${bytes.map(byte=>`<span class="rule-byte">${[...byte].map(char=>`<span class="rule-bit ${char==='x'?'payload':'marker'}">${char}</span>`).join('')}</span>`).join('')}</div>`;
}
function renderRuleKey(kind,cps){
  const max=Math.max(...cps);
  let title,rows;
  if(kind==='utf8'){
    const active=max<=0x7F?0:max<=0x7FF?1:max<=0xFFFF?2:3;
    title='UTF-8 prefix key · orange identifies each byte’s role';
    rows=[
      ['0xxxxxxx','Complete 1-byte sequence',active===0],
      ['110xxxxx 10xxxxxx','Start of a 2-byte sequence + continuation',active===1],
      ['1110xxxx 10xxxxxx 10xxxxxx','Start of a 3-byte sequence + continuations',active===2],
      ['11110xxx 10xxxxxx 10xxxxxx 10xxxxxx','Start of a 4-byte sequence + continuations',active===3]
    ];
  }else if(kind.startsWith('utf16')){
    const pair=max>0xFFFF;
    title='UTF-16 code-unit key · byte order is applied after this step';
    rows=[
      ['xxxxxxxxxxxxxxxx','One 16-bit code unit for U+0000–U+FFFF',!pair],
      ['110110xxxxxxxxxx 110111xxxxxxxxxx','High + low surrogate for U+10000–U+10FFFF',pair]
    ];
  }else{
    title='UTF-32 code-unit key · every code point has a fixed width';
    rows=[['xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx','One 32-bit code unit; byte order controls serialization',true]];
  }
  document.querySelector('#rule-key').innerHTML=`<summary class="rule-key-title">${title}</summary><div class="rule-key-body">${rows.map(([pattern,description,active])=>`<div class="rule-row ${active?'active':''}">${rulePattern(pattern)}<div class="rule-description">${description}</div></div>`).join('')}</div>`;
}
function renderBomBreakdown(kind,characterBytes){
  const info=encodingInfo[kind];
  let byteRoles,meaning;
  if(kind==='utf8'){
    byteRoles=['Leading byte of the 3-byte UTF-8 sequence','Continuation byte carrying payload','Continuation byte carrying payload'];
    meaning='Remove the UTF-8 marker bits (1110, 10, 10) and join the blue payload bits. They form 1111111011111111 = U+FEFF.';
  }else if(kind.startsWith('utf16')){
    const little=kind.endsWith('le');
    byteRoles=little?['Low byte stored first','High byte stored second']:['High byte stored first','Low byte stored second'];
    meaning=`Read in ${little?'little':'big'}-endian order and these two bytes form FEFF = U+FEFF. Their order also tells a reader that the rest of this UTF-16 stream is ${little?'little':'big'} endian.`;
  }else{
    const little=kind.endsWith('le');
    byteRoles=little?['Least-significant byte','Next byte','Next byte','Most-significant byte']:['Most-significant byte','Next byte','Next byte','Least-significant byte'];
    meaning=`Read in ${little?'little':'big'}-endian order and these four bytes form 0000FEFF = U+FEFF. Their order identifies this as ${little?'little':'big'}-endian UTF-32.`;
  }
  const bytes=info.bom.map((byte,i)=>{
    const types=kind==='utf8'?(i===0?['marker','marker','marker','marker','payload','payload','payload','payload']:['marker','marker','payload','payload','payload','payload','payload','payload']):Array(8).fill('bom');
    return `<div class="bom-byte-card"><span>BOM BYTE ${i+1}</span>${bitsHTML(byteBits(byte,types))}<strong>0x${hex(byte)}</strong><p>${byteRoles[i]}</p></div>`;
  }).join('');
  document.querySelector('#bom-breakdown').innerHTML=`
    <div class="bom-equation"><span>${info.label} BOM USED BY THIS EXAMPLE</span><strong>${info.bom.map(byte=>hex(byte)).join(' ')}</strong><em>encodes the special marker U+FEFF</em></div>
    <div class="bom-byte-breakdown">${bytes}</div>
    <p class="bom-meaning">${meaning}</p>
    <div class="stream-example"><span class="stream-bom">${info.bom.map(byte=>hex(byte)).join(' ')}<small>one BOM</small></span><b>→</b><span>${characterBytes.map(byte=>hex(byte)).join(' ')}<small>character data begins</small></span></div>
    <p class="bom-meaning">It appears once at the beginning of the complete text stream—not before every character. It can be omitted when the encoding${kind==='utf8'?'':' and byte order'} is already known.</p>`;
}

function render(){
  const grapheme=firstGrapheme(input.value);
  if(input.value!==grapheme) input.value=grapheme;
  const cps=Array.from(grapheme,c=>c.codePointAt(0));
  const kind=encodingSelect.value, info=encodingInfo[kind];
  const bomExplainer=document.querySelector('.bom-explainer');
  bomExplainer.hidden=!bomToggle.checked;
  if(!bomToggle.checked) bomExplainer.open=false;
  document.querySelector('#glyph').textContent=grapheme;
  document.querySelector('#grapheme-label').textContent=cps.length===1?'One grapheme · one code point':`One grapheme · ${cps.length} code points`;
  document.querySelector('#grapheme-note').textContent=cps.length===1?'This visible character has a single Unicode scalar value.':'What looks like one character is assembled from several Unicode values.';
  document.querySelector('#codepoint-list').innerHTML=cps.map(cp=>`<div class="codepoint-card"><span class="mini-glyph">${String.fromCodePoint(cp)}</span><div><span>${cpName(cp)}</span><strong>U+${hex(cp,Math.max(4,hex(cp).length))}</strong></div></div>`).join('');
  document.querySelector('#value-list').innerHTML=cps.map(cp=>`<div class="value-card"><span>U+${hex(cp,Math.max(4,hex(cp).length))}</span><strong>DEC ${cp.toString(10)} · HEX ${hex(cp)}</strong><strong class="binary-value">BIN ${cp.toString(2)}</strong></div>`).join('');

  const units=cps.flatMap((cp,ci)=>encode(cp,kind).map(u=>({...u,cp,ci})));
  document.querySelector('#units-title').textContent=`${info.label} encoding rule`;
  const explanations={utf8:'UTF-8 uses 1–4 bytes. Orange prefix bits announce the sequence length; blue bits carry the code-point value.',utf16le:'UTF-16 uses one 16-bit code unit, or a surrogate pair above U+FFFF. Little endian stores each low byte first.',utf16be:'UTF-16 uses one 16-bit code unit, or a surrogate pair above U+FFFF. Big endian stores each high byte first.',utf32le:'UTF-32 uses one fixed 32-bit code unit. Little endian sends the least-significant byte first.',utf32be:'UTF-32 uses one fixed 32-bit code unit. Big endian sends the most-significant byte first.'};
  document.querySelector('#encoding-explanation').textContent=explanations[kind];
  document.querySelector('#unit-list').innerHTML=units.map((u,i)=>`<div class="unit-card"><span class="unit-caption">U+${hex(u.cp,Math.max(4,hex(u.cp).length))} · ${u.caption}</span>${bitsHTML(u.bits)}<div class="unit-hex">BYTE ${i+1}: 0x${hex(u.byte)}</div></div>`).join('');
  renderRuleKey(kind,cps);

  const bomUnits=bomToggle.checked?info.bom.map((byte,i)=>({byte,bits:byteBits(byte,Array(8).fill('bom')),caption:`BOM byte ${i+1}`,isBom:true})):[];
  const stream=[...bomUnits,...units];
  document.querySelector('#binary-output').innerHTML=stream.map((u,i)=>`<div class="byte ${u.isBom?'bom-byte':''}"><span class="byte-index">${u.isBom?'BOM':`byte ${i+1-bomUnits.length}`}</span>${bitsHTML(u.bits)}</div>`).join('');
  document.querySelector('#hex-output').textContent=stream.map(u=>hex(u.byte)).join(' ');
  document.querySelector('#decimal-output').textContent=stream.map(u=>u.byte).join(' · ');
  document.querySelector('#size-output').textContent=`${stream.length} byte${stream.length===1?'':'s'}`;
  document.querySelector('#bom-note').innerHTML=`<span class="dot" style="background:var(--violet)"></span>${bomToggle.checked?'The BOM is stream metadata, prepended once—not part of the character. ':''}${info.bomText}`;
  renderBomBreakdown(kind,units.map(unit=>unit.byte));
}

input.addEventListener('input',render); encodingSelect.addEventListener('change',render); bomToggle.addEventListener('change',render);
document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>{input.value=button.dataset.example;render();input.focus()}));
if(!document.fullscreenEnabled){
  fullscreenToggle.hidden=true;
}else{
  fullscreenToggle.addEventListener('click',async()=>{
    try{
      if(document.fullscreenElement) await document.exitFullscreen();
      else await widget.requestFullscreen();
    }catch(error){
      fullscreenToggle.title='Full screen is unavailable in this embed';
    }
  });
  document.addEventListener('fullscreenchange',()=>{
    const active=Boolean(document.fullscreenElement);
    fullscreenToggle.innerHTML=active?'× <span>Exit Full Screen</span>':'⛶ <span>Full Screen</span>';
    fullscreenToggle.setAttribute('aria-label',active?'Exit full screen':'Open lab in full screen');
  });
}
render();
