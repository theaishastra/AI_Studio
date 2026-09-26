
const API_BASE=window.SAI_API_BASE||"http://localhost:8000";
const params=new URLSearchParams(location.search);
const CAT_LABELS={
  wedding:"Wedding Photography", prewedding:"Pre-Wedding", maternity:"Maternity Shoot",
  baby:"Baby Shoot", birthday:"Birthday Photography", event:"Event Photography",
  outdoor:"Outdoor Photography", drone:"Drone Videography",
  video:"Videography", album:"Album Designing", housewarming:"House Warming",
  sareefunction:"Saree Function",
  /* services that are booked straight from the Equipment & Coverage modal on
     photography.html (directBookEquip) rather than from a package card */
  traditionalphoto:"Traditional Photography", traditionalvideo:"Traditional Videography",
  cinematicvideo:"Cinematic Videography", candidphoto:"Candid Photography",
  ledscreens:"LED Screens"
};
const CATEGORY_IMAGES={
  wedding:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/hero/wedding.png",
  prewedding:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/hero/pre-wedding.png",
  maternity:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/hero/maternity.jpg",
  baby:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/hero/baby-shower.jpg",
  birthday:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/hero/birthday-event.jpg",
  outdoor:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/hero/outdoor.jpg",
  drone:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/hero/drone.jpg",
  video:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/hero/video.jpg",
  album:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/hero/album%20designing.jpg",
  event:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/hero/wedding.png",
  housewarming:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/hero/wedding.png",
  sareefunction:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/hero/saree%20ceremony.png",
  traditionalphoto:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/traditional-photography-1.png",
  traditionalvideo:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/video_1.jpg",
  cinematicvideo:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/cinematic-videography-1.png",
  candidphoto:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/wedding-1.png",
  ledscreens:"https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/led-screens-1.png"
};
/* Cloudinary auto-format/auto-quality transform: purely size-reducing (no resize/crop),
   safe to wrap any URL — no-ops for non-Cloudinary URLs or already-transformed ones. */

function resolveCategoryImage(cat){
  return cldOpt(CATEGORY_IMAGES[cat] || CATEGORY_IMAGES.wedding);
}

/* exact on-disk filenames for Photography_assets/assets/packages/ (verified against
   the folder — every category/tier has 3 real photos; naming is inconsistent
   per category, dash vs underscore vs space, and png/jpg/jpeg mixed) */
const PACKAGE_IMAGES={
  "wedding|standard":["wedding%20standard-1.jpg","wedding%20standard-2.jpg","wedding%20standard-3.jpg"],
  "wedding|premium":["wedding%20premium-1.jpg","wedding%20premium-2.jpg","wedding%20premium-3.jpg"],
  "wedding|platinum":["wedding%20platinum-1.jpg","wedding%20platinum-2.jpg","wedding%20platinum-3.jpg"],
  "prewedding|standard":["prewedding_standard_1.jpg","prewedding_standard_2.jpg","prewedding_standard_3.jpg"],
  "prewedding|premium":["prewedding-premium_1.jpg","prewedding-premium_2.jpg","prewedding-premium_3.jpg"],
  "prewedding|platinum":["prewedding-platinum_1.jpg","prewedding-platinum_2.jpg","prewedding-platinum_3.jpg"],
  "maternity|standard":["maternity%20standard_1.jpg","maternity%20standard_2.jpg","maternity%20standard_3.jpg"],
  "maternity|premium":["maternity%20premium_1.jpg","maternity%20premium_2.jpg","maternity%20premium_3.jpg"],
  "maternity|platinum":["maternity-platinum-1.png","maternity-platinum-2.png","maternity-platinum-3.png"],
  "baby|standard":["baby-standard-1.png","baby-standard-2.jpg","baby-standard-3.jpg"],
  "baby|premium":["baby-premium-1.jpg","baby-premium-2.jpg","baby-premium-3.jpg"],
  "baby|platinum":["baby-platinum-1.jpg","baby-platinum-2.jpg","baby-platinum-3.jpg"],
  "birthday|standard":["birthday-standard-1.jpg","birthday-standard-2.jpg","birthday-standard-3.jpg"],
  "birthday|premium":["birthday-premium-1.jpg","birthday-premium-2.jpg","birthday-premium-3.jpg"],
  "birthday|platinum":["birthday-platinum-1.jpg","birthday-platinum-2.jpg","birthday-platinum-3.jpg"],
  "event|standard":["event-standard-1.png","event-standard-2.png","event-standard-3.png"],
  "event|premium":["event-premium-1.png","event-premium-2.png","event-premium-3.png"],
  "event|platinum":["event-platinum-1.png","event-platinum-2.png","event-platinum-3.png"],
  "outdoor|standard":["outdoor-standard-1.png","outdoor-standard-2.jpg","outdoor-standard-3.png"],
  "outdoor|premium":["outdoor-premium-1.png","outdoor-premium-2.png","outdoor-premium-3.png"],
  "outdoor|platinum":["outdoor-platinum-1.png","outdoor-platinum-2.png","outdoor-platinum-3.png"],
  "drone|standard":["drone_standard-1.png","drone_standard-2.png","drone_standard-3.png"],
  "drone|premium":["drone_premium-1.png","drone_premium-2.png","drone_premium-3.png"],
  "drone|platinum":["drone_platinum-1.png","drone_platinum-2.png","drone_platinum-3.png"],
  "video|standard":["vedio_standard-1.png","vedio_standard-2.png","video_standard-3.jpg"],
  "video|premium":["video%20premium-1.jpg","video%20premium-2.jpg","video%20premium-3.jpg"],
  "video|platinum":["video%20platinum-1.jpg","video%20platinum-2.jpg","video%20platinum-3.jpg"],
  "album|standard":["album%20standard-1.jpg","album%20standard-2.jpg","album%20standard-3.jpg"],
  "album|premium":["album%20premium-1.jpg","album%20premium-2.jpg","album%20premium-3.jpg"],
  "album|platinum":["album%20platinum-1.jpg","album%20platinum-2.jpg","album%20platinum-3.jpg"],
  "housewarming|standard":["housewarming%20standard-1.jpg","housewarming%20standard-2.jpg","housewarming%20standard-3.jpg"],
  "housewarming|premium":["housewarming%20premium-1.jpg","housewarming%20premium-2.jpg","housewarming%20premium-3.jpg"],
  "housewarming|platinum":["housewarming%20platinum-1.jpg","housewarming%20platinum-2.jpg","house%20warming%20platinum-3.jpg"],
  "sareefunction|standard":["saree-ceremony-standard-1.jpg","saree-ceremony-standard-2.jpg","saree-ceremony-standard-3.jpg"],
  "sareefunction|premium":["saree-ceremony-premium-1.jpg","saree-ceremony-premium-2.jpg","saree-ceremony-premium-3.jpg"],
  "sareefunction|platinum":["saree-ceremony-platinum-1.jpg","saree-ceremony-platinum-2.jpg","saree-ceremony-platinum-3.jpg"],
  "traditionalphoto|standard":["traditional-photography-standard-1.png","traditional-photography-standard-2.png","traditional-photography-standard-3.png"],
  "traditionalphoto|premium":["traditional-photography-premium-1.png","traditional-photography-premium-2.png","traditional-photography-premium-3.png"],
  "traditionalphoto|platinum":["traditional-photography-platinum-1.png","traditional-photography-platinum-2.png","traditional-photography-platinum-3.png"],
  "cinematicvideo|standard":["cinematic-videography-standard-1.png","cinematic-videography-standard-2.png","cinematic-videography-standard-3.png"],
  "cinematicvideo|premium":["cinematic-videography-premium-1.png","cinematic-videography-premium-2.png","cinematic-videography-premium-3.png"],
  "cinematicvideo|platinum":["cinematic-videography-platinum-1.png","cinematic-videography-platinum-2.png","cinematic-videography-platinum-3.png"],
  "ledscreens|standard":["led-screens-standard-1.png","led-screens-standard-2.png","led-screens-standard-3.png"],
  "ledscreens|premium":["led-screens-premium-1.png","led-screens-premium-2.png","led-screens-premium-3.png"],
  "ledscreens|platinum":["led-screens-platinum-1.png","led-screens-platinum-2.png","led-screens-platinum-3.png"]
};

/* Services booked from the Equipment & Coverage modal have no tiered package shoot of
   their own, so the gallery falls back to the SAME three portfolio photos the modal on
   photography.html shows for that service (EQUIPMENT_DATA[id].gallery). Without this
   every one of them dropped through to the wedding hero three times over. */
const EQUIPMENT_GALLERIES={
  traditionalphoto:["traditional-photography-1.png","traditional-photography-2.png","traditional-photography-3.png"],
  traditionalvideo:["video_1.jpg","video_2.jpg","video_3.jpg"],
  cinematicvideo:["cinematic-videography-1.png","cinematic-videography-2.png","cinematic-videography-3.png"],
  candidphoto:["wedding-1.png","wedding-2.png","wedding-3.png"],
  ledscreens:["led-screens-1.png","led-screens-2.png","led-screens-3.png"]
};
function resolvePackageImages(cat,tier){
  const tierKey=(tier||"").toLowerCase().replace(/\s+/g,"-");
  const files=PACKAGE_IMAGES[cat+"|"+tierKey];
  if(files) return files.map(f=>cldOpt(`https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/packages/${f}`));
  // equipment/coverage service — show its own three portfolio photos
  const equip=EQUIPMENT_GALLERIES[cat];
  if(equip) return equip.map(f=>cldOpt(`https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/${f}`));
  // no dedicated package photos for this category/tier — reuse its hero image
  // (always exists) so the gallery never shows a broken thumbnail
  return [resolveCategoryImage(cat),resolveCategoryImage(cat),resolveCategoryImage(cat)];
}

const cat=params.get("category")||"wedding";
const catLabel=CAT_LABELS[cat]||"Wedding Photography";
const genericFeats=["High-Quality Output","Premium Editing & Delivery","Professional Team","Quick Studio Handover"];

/* `current` is what actually gets submitted (goToBookingForm) and is what the page
   displays — starts from the link's own query params (instant paint, no loading
   flicker) and is OVERWRITTEN by the real database record once fetchAuthoritativeProduct()
   resolves below, same pattern as photography.js's PACKAGES coming from the API instead
   of being hardcoded. A visitor editing price/tier/feats by hand in the address bar no
   longer has any effect once that fetch lands - only what the database actually has for
   this product id ever reaches goToBookingForm()/the final booking. */
const current={
  pid:params.get("pid")||"",
  pkg:params.get("package")||"Standard Wedding Photography",
  tier:(params.get("tier")||"standard").toLowerCase(),
  price:params.get("price")||"₹24,999",
  feat:(params.get("feats")||"").split("|").filter(Boolean),
  extra:{},
};

function goToBookingForm(){
  const q=new URLSearchParams({pid:current.pid,category:cat,package:current.pkg,tier:current.tier,price:current.price});
  /* the service label and this package's own photo are resolved here, where the
     maps that define them live, and travel with the booking so "My Photography
     Bookings" can show the customer the package they actually booked instead of
     just its name */
  q.set("catlabel",catLabel);
  const packageImages=resolvePackageImages(cat,current.tier);
  if(packageImages&&packageImages[0]) q.set("image",packageImages[0]);
  /* the Confirm Booking form lives on booking-form.html, so any add-ons picked in the
     Equipment & Coverage section above have to travel with it — names for the existing
     summary line, and name+price+photo per add-on so the booking record keeps what
     each one actually is, not just a bare label, once there's more than one of them */
  if(selectedEquipSet.size){
    const picked=Array.from(selectedEquipSet).map(id=>EQUIPMENT_DATA[id]);
    q.set("equipments",picked.map(e=>e.name).join(", "));
    q.set("addons",JSON.stringify(picked.map(e=>({name:e.name,price:e.priceAdd||"",icon:e.icon||"",image:e.bgImage||""}))));
  }
  window.location.href="booking-form.html?"+q.toString();
}

/* "Change package" must return to this same service's packages on the Photography page,
   not always the default Wedding view */
document.getElementById("changePackageLink").href=cat?`photography.html?category=${encodeURIComponent(cat)}`:"photography.html";

/* Paints every product-dependent part of the page from one record - called once
   immediately with the link's own params (fast first paint) and again with the
   authoritative database record once fetchAuthoritativeProduct() resolves. */
function applyProductData(p){
  current.pkg=p.pkg; current.tier=p.tier; current.price=p.price; current.feat=p.feat; current.extra=p.extra||{};

  {
    const crumb=document.getElementById("crumb");
    crumb.textContent="Home / "+catLabel+" / ";
    const b=document.createElement("b");
    b.textContent=p.pkg;
    crumb.appendChild(b);
  }
  document.getElementById("iCat").textContent=catLabel;
  document.getElementById("iTitle").textContent=p.pkg;
  document.getElementById("iSub").textContent=(p.tier?p.tier.charAt(0).toUpperCase()+p.tier.slice(1)+" package — ":"")+"professionally shot & edited by Sai Kumar Digital Lab & Studio.";
  document.getElementById("iPrice").textContent=p.price;
  document.getElementById("lkPkg").textContent=p.pkg;
  document.getElementById("lkPrice").textContent=p.price;
  document.title=`Book ${p.pkg} — Sai Kumar Digital Lab & Studio`;

  const showFeats=p.feat.length?p.feat:genericFeats;
  document.getElementById("iHighlights").innerHTML=showFeats.map(f=>`<li>${f}</li>`).join("");

  renderPackageDetails(showFeats,p.extra||{});

  if(p.images&&p.images.length){
    renderGalleryThumbs(p.images);
  }
}

/* ================= RICH PACKAGE-DETAILS LAYOUT (every service) =================
   Saree Function was the first service written up in this format — Package Includes,
   Additional Benefits, Events & Team Details, Why Choose Us, and the Confirm Booking
   form moved onto its own page (booking-form.html) behind the "Complete Your Booking"
   button. Every service now renders that SAME layout.

   A service with an entry in SERVICE_DETAILS below shows its own hand-written copy
   (Saree Function's is kept verbatim). Every other service gets the same blocks built
   from that package's real inclusions — the `feats` passed in the URL, straight out of
   PACKAGES on photography.html — so the crew, hours and deliverables shown are the ones
   the package actually sells and nothing is invented per service. As each service's own
   write-up is ready, add it here in the same shape as sareefunction and it takes over
   from the generated version. */
const SERVICE_DETAILS={
  sareefunction:{
    includes:[
      ["📷","Unlimited Soft Copies"],
      ["🎥","1 Hour Long Traditional Video"],
      ["🎬","4-5 Mins Cinematic Teaser"],
      ["📖","1 Album – 40 Sheets"],
      ["🖨️","Non-Tearable Glossy Print"],
      ["📸","On-Location Portrait Sessions"]
    ],
    benefits:{
      left:[
        "Coverage includes – getting ready, details, decor,",
        "event coverage and on-location portrait sessions",
        "1 Save the date pics Whatsapp invitation",
        "1 Video All soft copies"
      ],
      right:[
        "Video will be given in clients hard drive",
        "TWO big photo frame"
      ]
    },
    events:[
      ["<b>22-08-2026</b><span class=\"evt-note\">(4-5 hours)</span>","1 - PHOTOGRAPHER<br>1 - VIDEOGRAPHER","2"],
      ["<b>23-08-2026</b><br>Saree Ceremony<span class=\"evt-note\">(4-5 hours)</span>","1 - PHOTOGRAPHER<br>1 - VIDEOGRAPHER<br>1 - CANDID PHOTOGRAPHER<br>1 - CINEMATIC VIDEOGRAPHER","4"],
      ["<b>PRE-SHOOT</b><span class=\"evt-note\">(6 hours)</span>","1 - CANDID PHOTOGRAPHER","1+"]
    ],
    song:"🎵 We'll create a special song using your daughter's name and add it to your video—made just for you."
  }
};

/* Studio-wide promises — shown as Additional Benefits for any service that has no
   hand-written list of its own yet. Edit these (or add a per-service `benefits` entry
   above) as the real copy for each service is finalised. */
const DEFAULT_BENEFITS=[
  "All edited soft copies shared digitally",
  "Professional editing & colour correction included",
  "Booking confirmation within 24 hours",
  "Delivery to your preferred location or an online album link"
];

/* icon for an inclusion line, matched on the words the package copy actually uses.
   Order matters: the specific patterns have to be tried before the general ones
   ("Cinematic Videographer" before "Videographer", "Photographers" before "Photos"). */
const INCLUDE_ICONS=[
  [/drone|aerial|crane/i,"🚁"],
  [/candid/i,"📸"],
  [/photographer/i,"📷"],
  [/videographer|video|film|footage/i,"🎥"],
  [/teaser|reel|highlight/i,"🎬"],
  [/score|music|song/i,"🎵"],
  [/album|photobook|photo book|sheet|page|\bcover\b/i,"📖"],
  [/print|canvas|frame|emboss|paper|glossy|matte/i,"🖨️"],
  [/makeup|styl|gown|outfit/i,"💄"],
  [/prop|theme/i,"🎈"],
  [/hour|full day|session|shoot|coverage/i,"⏱️"],
  [/location|outdoor|venue|mapping|panorama/i,"📍"],
  [/invit/i,"💌"],
  [/photo|portrait/i,"🖼️"],
  [/deliver|digital|soft cop|usb|cloud|link|turnaround|resolution|4k|hd/i,"💾"]
];
function includeIcon(text){
  for(const [re,ico] of INCLUDE_ICONS){ if(re.test(text)) return ico; }
  return "✨";
}

/* The crew and the hours are already spelled out inside each package's own inclusions,
   so the Events & Team table is read off them rather than re-typed per service. Each
   matched phrase is blanked out as it is counted, so "1 Cinematic Videographer" counts
   once as a cinematic videographer and not again as a plain videographer. */
const CREW_PATTERNS=[
  [/(\d+)\s+(?:\w+\s+)?candid photographers?/i,"CANDID PHOTOGRAPHER"],
  [/(\d+)\s+(?:\w+\s+)?cinematic videographers?/i,"CINEMATIC VIDEOGRAPHER"],
  [/(\d+)\s+(?:\w+\s+)?drone pilots?/i,"DRONE PILOT"],
  [/(\d+)\s+(?:\w+\s+)?photographers?/i,"PHOTOGRAPHER"],
  [/(\d+)\s+(?:\w+\s+)?videographers?/i,"VIDEOGRAPHER"]
];
function parseCrew(list){
  const counts=new Map();
  list.forEach(item=>{
    CREW_PATTERNS.forEach(([re,label])=>{
      item=item.replace(new RegExp(re.source,"gi"),(m,n)=>{
        counts.set(label,(counts.get(label)||0)+Number(n));
        return " ";
      });
    });
  });
  return counts;
}
function parseDuration(list){
  for(const item of list){
    const m=item.match(/(\d+\s*(?:[-–]\s*\d+)?)\s*hours?/i);
    if(m) return m[1].replace(/\s+/g,"")+" hours";
  }
  if(list.some(item=>/full day/i.test(item))) return "Full day";
  return "";
}
/* Aerial work is its own crew line, and Photo Albums are a print product with nobody on
   site — neither should have a photographer/videographer inferred for it. */
const CREW_INFER_SKIP=["drone","album"];
function buildEventRows(list){
  const counts=parseCrew(list);
  /* a package often describes its crew loosely ("3 Hours Studio Session") instead of by
     head count — fill in the minimum the deliverables require, so the table is never
     blank, and never more than the package copy actually supports */
  if(!CREW_INFER_SKIP.includes(cat)){
    if(!counts.has("PHOTOGRAPHER")&&!counts.has("CANDID PHOTOGRAPHER")&&
       list.some(item=>/photograph|shoot|session|coverage|portrait/i.test(item))) counts.set("PHOTOGRAPHER",1);
    if(!counts.has("VIDEOGRAPHER")&&!counts.has("CINEMATIC VIDEOGRAPHER")&&
       list.some(item=>/video|film|reel|teaser/i.test(item))) counts.set("VIDEOGRAPHER",1);
  }
  if(!counts.has("DRONE PILOT")&&list.some(item=>/drone|aerial|crane/i.test(item))) counts.set("DRONE PILOT",1);

  const units=[]; let total=0;
  counts.forEach((n,label)=>{ units.push(`${n} - ${label}${n>1?"S":""}`); total+=n; });
  if(!units.length) units.push("Studio production — no on-site crew");
  const dur=parseDuration(list);
  return [[`<b>${catLabel}</b>${dur?`<span class="evt-note">(${dur})</span>`:""}`,units.join("<br>"),total||"—"]];
}

/* Equipment-only products (Drone/Traditional Videography/Candid Photography/...) carry
   their real crew/hours as plain text in Product.extra (see backend/app/seed.py
   EQUIPMENT_PRODUCTS) instead of needing it guessed out of a feature-bullet list - use
   that directly when present rather than running buildEventRows()'s regex inference. */
function buildEventRowsFromExtra(extra){
  const total=(String(extra.crew||"").match(/^(\d+)/)||[])[1]||"—";
  return [[`<b>${catLabel}</b>${extra.hours?`<span class="evt-note">(${extra.hours})</span>`:""}`,extra.crew||"Studio production — no on-site crew",total]];
}

/* Admin-entered rows (Product.extra.events, filled in on the "Add Product" form) take
   priority over every guessed/hand-written table below — this is the one path where the
   Events & Team Details table is explicitly authored per-product instead of inferred. */
function buildEventRowsFromAdmin(events){
  return events.map(row=>[
    `<b>${row.event||catLabel}</b>`,
    (row.team||"").replace(/\n/g,"<br>")||"Studio production — no on-site crew",
    row.total!=null?row.total:"—",
  ]);
}

function renderPackageDetails(showFeats,extra){
  const d=SERVICE_DETAILS[cat]||{};

  const includes=d.includes||showFeats.map(f=>[includeIcon(f),f]);
  document.getElementById("pkgIncludesGrid").innerHTML=includes.map(([ico,label])=>
    `<div class="pi-item"><span class="pi-ico">${ico}</span><span>${label}</span></div>`).join("");

  let benefits=d.benefits;
  if(!benefits){
    const half=Math.ceil(DEFAULT_BENEFITS.length/2);
    benefits={left:DEFAULT_BENEFITS.slice(0,half),right:DEFAULT_BENEFITS.slice(half)};
  }
  const ul=items=>`<ul>${items.map(b=>`<li>${b}</li>`).join("")}</ul>`;
  document.getElementById("pkgBenefitsGrid").innerHTML=ul(benefits.left)+ul(benefits.right);

  const rows=(extra&&extra.events&&extra.events.length?buildEventRowsFromAdmin(extra.events):null)
    ||d.events
    ||(extra&&extra.crew?buildEventRowsFromExtra(extra):buildEventRows(showFeats));
  document.getElementById("eventsTeamBody").innerHTML=rows.map(([evt,unitsHtml,total])=>
    `<tr><td>${evt}</td><td>${unitsHtml}</td><td class="total-col">${total}</td></tr>`).join("");

  document.getElementById("pkgIncludes").style.display="block";
  document.getElementById("pkgBenefits").style.display="block";
  document.getElementById("eventsTeam").style.display="block";
  document.getElementById("detailCtaRow").style.display="flex";
  document.getElementById("whyUs").style.display="block";
  /* "Package Includes" above is the same list laid out properly — drop the plain one */
  document.getElementById("highlightsBlock").style.display="none";
  /* the Confirm Booking form now lives on booking-form.html for every service */
  document.getElementById("bookingSection").style.display="none";

  if(d.song){
    const chip=document.getElementById("songChip");
    chip.textContent=d.song;
    chip.style.display="flex";
  }
}

function renderGalleryThumbs(imgs){
  window._imgs=imgs;
  document.getElementById("thumbs").innerHTML=imgs.map((src,i)=>`
  <div class="thumb ${i===0?'active':''}" onclick="setMain(${i})">
    <img class="thumb-photo" src="${src}" alt="view ${i+1}" loading="${i===0?'eager':'lazy'}"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
    <div class="ph">Image ${i+1}<br>add photo</div>
  </div>`).join("");
  setMain(0);
}
function setMain(i){
  document.querySelectorAll(".thumb").forEach((t,j)=>t.classList.toggle("active",j===i));
  const box=document.getElementById("mainImg");
  box.querySelector(".main-photo")?.remove();
  const ph=document.getElementById("mainPh");
  ph.innerHTML="Image "+(i+1)+"<br>［ add photo ］";ph.style.display="flex";
  const img=document.createElement("img");
  img.className="main-photo";img.src=window._imgs[i];
  img.onload=()=>{ph.style.display="none";};
  img.onerror=()=>{img.remove();ph.style.display="flex";};
  box.prepend(img);
}

/* initial paint from the link's own params (instant, no loading flicker) - see
   fetchAuthoritativeProduct() near the end of this file for the real-data follow-up */
applyProductData({pkg:current.pkg,tier:current.tier,price:current.price,feat:current.feat,images:resolvePackageImages(cat,current.tier)});

/* The old inline "Confirm Booking" form (#bookingSection) that used to live here
   is permanently hidden - see renderPackageDetails() above, which unconditionally
   sets its display to "none" because "the Confirm Booking form now lives on
   booking-form.html for every service". Its JS (event-schedule builder, validation,
   and a submitBooking() that only ever built a query string for
   booking-confirmation.html and never called POST /api/bookings) was dead code
   that had already drifted from booking-form.js's real, backend-integrated
   version - removed to close off the risk of it silently going live again via a
   future CSS/markup change and quietly losing real bookings. */

/* ================= INSIDE-EVENT EQUIPMENT DATA & MODAL SYSTEM ================= */
const EQUIPMENT_DATA = {
  candidphoto: {
    id: "candidphoto",
    name: "Candid Photography",
    icon: "📷",
    tagline: "Unscripted, natural emotional moments captured seamlessly with zero forced posing.",
    crew: "2 Senior Candid Photographers",
    hours: "8 – 10 Hours (Full Event)",
    gear: [
      "Sony Alpha A7IV & A7SIII Full-Frame Bodies",
      "Sony FE 35mm f/1.4 GM & 85mm f/1.4 GM Prime Lenses",
      "Silent Electronic/Mechanical Shutters for quiet ceremony shooting",
      "Godox V1 Round-Head Speedlites with Wireless Triggers"
    ],
    deliverables: [
      "250+ High-Res Retouched Candid Photos",
      "Private Online Password-Protected Cloud Gallery",
      "All Raw Unedited Images on USB Flash Drive"
    ],
    priceAdd: "₹8,000",
    bgImage: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/wedding-1.png",
    gallery: [
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/wedding-1.png",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/wedding-2.png",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/wedding-3.png"
    ]
  },
  drone: {
    id: "drone",
    name: "Drone Videography",
    icon: "🛸",
    tagline: "Breathtaking 4K aerial footage of venue, baraat procession, and outdoor celebrations.",
    crew: "1 Certified DGCA Drone Pilot + 1 Visual Spotter",
    hours: "4 – 6 Hours Flight Coverage",
    gear: [
      "DJI Mavic 3 Pro Cine (4K/60fps HDR, Hasselblad 4/3 CMOS)",
      "DJI RC Pro Remote Controller with High-Bright Display",
      "Professional PolarPro ND/PL Filter Pack",
      "6 Intelligent Flight Batteries for continuous aerial coverage"
    ],
    deliverables: [
      "3-5 Min 4K Aerial Highlight Reel with Sound Design",
      "Uncut Raw 4K Aerial Clips",
      "Stunning 20MP Aerial Panoramic Photographs"
    ],
    priceAdd: "₹6,000",
    bgImage: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/drone_1.jpg",
    gallery: [
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/drone_1.jpg",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/drone_2.jpg",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/drone_3.jpg"
    ]
  },
  cinematicvideo: {
    id: "cinematicvideo",
    name: "Cinematic Videography",
    icon: "🎬",
    tagline: "Movie-quality storytelling with dynamic camera motion, cinema color grading & custom audio.",
    crew: "2 Senior Cinema Directors / Videographers",
    hours: "8 – 12 Hours (Full Day Event)",
    gear: [
      "Sony FX3 Cinema Line Full-Frame Cameras",
      "DJI RS 3 Pro Gimbal Stabilizer & Motorized Sliders",
      "Sirui Cine Anamorphic Lenses for true widescreen depth",
      "Sennheiser AVX Wireless Lavalier Mics & Zoom F6 Recorders"
    ],
    deliverables: [
      "4-5 Min Cinematic Teaser Trailer (4K HDR)",
      "20-30 Min Master Feature Film",
      "Custom Composed Background Score & Dialogue Mix"
    ],
    priceAdd: "₹12,000",
    bgImage: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/cinematic-videography-1.png",
    gallery: [
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/cinematic-videography-1.png",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/cinematic-videography-2.png",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/cinematic-videography-3.png"
    ]
  },
  album: {
    id: "album",
    name: "Album Designing",
    icon: "📔",
    tagline: "Heirloom-quality photobooks with non-tearable lay-flat spreads & gold foil embossing.",
    crew: "1 Master Photobook Layout Designer & Binder",
    hours: "Unlimited Digital Proofing & Revisions",
    gear: [
      "Archival Epson SureColor 10-Color HD Photo Press",
      "Thermal Lay-Flat Creasing & Binding Machinery",
      "Precision Metallic Foil Stamping & Debossing Press",
      "Calibrated Adobe RGB Master Color Monitors"
    ],
    deliverables: [
      "1 Premium Canvera/Italian Leather Lay-Flat Photobook (40-50 Sheets / 100 Photos)",
      "Custom Leatherette Presentation Box with Velvet Lining",
      "1 Mini Replica Album for Parents / Gifting"
    ],
    priceAdd: "₹7,500",
    bgImage: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/album_1.jpg",
    gallery: [
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/album_1.jpg",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/album_2.jpg",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/album_3.jpg"
    ]
  },
  traditionalphoto: {
    id: "traditionalphoto",
    name: "Traditional Photography",
    icon: "🪔",
    tagline: "Complete formal documentation of every ritual, family group, and stage greeting.",
    crew: "2 Senior Traditional Photographers",
    hours: "Full Event Ceremony (No Hourly Cutoff)",
    gear: [
      "Canon EOS 5D Mark IV & Nikon Z6II Professional Bodies",
      "Canon EF 24-70mm f/2.8L II USM Zoom Lenses",
      "Godox AD600Pro Off-Camera Strobe Lighting Rigs",
      "Heavy-Duty Heavy Light Stands & Softbox Diffusers"
    ],
    deliverables: [
      "500+ Fully Color Corrected Formal & Ritual Photos",
      "Structured Ceremonial Photo Folders",
      "High-Resolution Print-Ready JPEG Files"
    ],
    priceAdd: "₹5,000",
    bgImage: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/traditional-photography-1.png",
    gallery: [
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/traditional-photography-1.png",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/traditional-photography-2.png",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/traditional-photography-3.png"
    ]
  },
  traditionalvideo: {
    id: "traditionalvideo",
    name: "Traditional Videography",
    icon: "🎞️",
    tagline: "Full-length chronological video record capturing every mantra, chant, and blessing without cuts.",
    crew: "2 Professional Event Videographers",
    hours: "Full Event Duration",
    gear: [
      "Sony HXR-NX80 4K Camcorders & PXW-Z190 3-CMOS Video Bodies",
      "Libec & Manfrotto Professional Fluid Head Tripods",
      "Rode Shotgun Mics & Direct Soundboard Recorders",
      "High-Output COB LED Light Panels with Diffusers"
    ],
    deliverables: [
      "1.5 – 2 Hours Full Length Ceremony Video (1080p / 4K)",
      "Branded Pendrive with Custom Engraved Box",
      "Direct Mobile-Streamable Digital Download Link"
    ],
    priceAdd: "₹6,500",
    bgImage: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/video_1.jpg",
    gallery: [
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/video_1.jpg",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/video_2.jpg",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/video_3.jpg"
    ]
  },
  ledscreens: {
    id: "ledscreens",
    name: "LED Screens",
    icon: "💡",
    tagline: "High-brightness stage backdrops & live camera feed walls so every guest gets a front-row view.",
    crew: "2 Live Video Technicians & Switcher Operator",
    hours: "Full Event Duration (Setup 3 Hours Prior)",
    gear: [
      "P2.5 Ultra High Brightness HD LED Panels (10ft x 15ft Modular)",
      "Novastar VX4S All-In-One HD Video Processor",
      "Blackmagic Design ATEM Mini Pro Live Production Switcher",
      "Heavy Duty Aluminum Truss System & Rigging"
    ],
    deliverables: [
      "Real-time Live Camera Video Streaming to LED Wall",
      "Custom Graphic Backdrops & Couple Slide Animations",
      "Complete On-Site Technical Management"
    ],
    priceAdd: "₹10,000",
    bgImage: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/led-screens-1.png",
    gallery: [
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/led-screens-1.png",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/led-screens-2.png",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/led-screens-3.png"
    ]
  },
  outdoor: {
    id: "outdoor",
    name: "Outdoor Photography",
    icon: "🏞️",
    tagline: "Scenic natural light portraits in lush outdoor locations & golden hour settings.",
    crew: "1 Senior Outdoor Portrait Specialist + 1 Assistant",
    hours: "4 – 6 Hours Location Session",
    gear: [
      "Canon EOS R5 Full-Frame Mirrorless Body",
      "Canon RF 85mm f/1.2L & RF 50mm f/1.2L Lenses",
      "Godox AD300Pro Portable Flash with Deep Parabolic Softbox",
      "5-in-1 Oval Light Reflectors & Portable Sun Diffusers"
    ],
    deliverables: [
      "50+ Fine-Art Magazine Quality Retouched Outdoor Photos",
      "2 Large Premium Canvas Wall Prints (16\"x24\")",
      "Full Resolution Digital Download Gallery"
    ],
    priceAdd: "₹7,000",
    bgImage: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/outdoor_1.jpg",
    gallery: [
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/outdoor_1.jpg",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/outdoor_2.jpg",
      "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/outdoor_3.jpg"
    ]
  }
};

let selectedEquipSet = new Set();

function renderEquipCards() {
  const container = document.getElementById("equipCardsGrid");
  if (!container) return;

  const items = Object.values(EQUIPMENT_DATA);
  container.innerHTML = items.map(item => {
    const isSelected = selectedEquipSet.has(item.id);
    return `
      <div class="eq-card ${isSelected ? 'selected' : ''}" id="eqCard_${item.id}" onclick="goEquipProductPage('${item.id}')" title="Open ${item.name} product page">
        <div class="eq-media">
          <img src="${cldOpt(item.bgImage)}" alt="${item.name}" loading="lazy">
          <div class="eq-media-overlay">
            <div class="eq-media-title"><span>${item.icon}</span> ${item.name}</div>
          </div>
        </div>
        <div class="eq-body">
          <p class="eq-tagline">${item.tagline}</p>
          <div class="eq-specs-row">
            <span class="eq-spec-pill">👥 ${item.crew}</span>
            <span class="eq-spec-pill">⏱️ ${item.hours}</span>
          </div>
          <div class="eq-actions">
            <button type="button" class="btn-explore" onclick="event.stopPropagation();goEquipProductPage('${item.id}')">🔍 View Product Page</button>
            <button type="button" class="btn-toggle-add" onclick="toggleEquipSelection('${item.id}', event)">
              ${isSelected ? '✓ Added' : '+ Add'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  updateEquipSummaryUI();
}

function toggleEquipSelection(id, event) {
  if (event) event.stopPropagation();
  if (selectedEquipSet.has(id)) {
    selectedEquipSet.delete(id);
  } else {
    selectedEquipSet.add(id);
  }
  renderEquipCards();
}

function updateEquipSummaryUI() {
  const count = selectedEquipSet.size;
  const countText = document.getElementById("equipCountText");
  if (countText) countText.textContent = `${count} Add-on${count === 1 ? '' : 's'} Selected`;

  const summaryField = document.getElementById("selectedEquipSummaryField");
  const displayBox = document.getElementById("selectedEquipListDisplay");
  if (summaryField && displayBox) {
    if (count === 0) {
      summaryField.style.display = "none";
      displayBox.innerHTML = "";
    } else {
      summaryField.style.display = "block";
      const list = Array.from(selectedEquipSet).map(id => {
        const eq = EQUIPMENT_DATA[id];
        return `<span class="equip-tag"><b>${eq.icon} ${eq.name}</b> (${eq.crew})</span>`;
      });
      displayBox.innerHTML = list.join(" ");
    }
  }
}

/* Clicking an Equipment & Add-ons card now goes straight to that service's own
   product page (same as directBookEquip() in photography.js) instead of opening
   the Explore Details popup in place. It has no pid of its own on this page (only
   EQUIPMENT_DATA's display copy for the card/modal), so it's resolved by looking
   up the id in the photography page bundle - the same source photography.js's
   PACKAGES comes from - then handed to booking.html as a fresh product link. */
function goEquipProductPage(id) {
  const item = EQUIPMENT_DATA[id];
  if (!item) return;
  fetch(`${API_BASE}/api/catalog/photography`)
    .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
    .then(data => {
      const p = (data.packages || {})[id] && data.packages[id][0];
      if (!p) throw new Error(`No product found for equipment id "${id}"`);
      const q = new URLSearchParams({
        pid: p.id,
        category: id,
        package: p.title,
        tier: (p.tier || "").toLowerCase(),
        price: p.price,
        feats: (p.feat || []).join("|"),
      });
      window.location.href = "booking.html?" + q.toString();
    })
    .catch(err => {
      console.error("Failed to open product page for equipment, falling back to its category page:", err);
      window.location.href = `photography.html?category=${encodeURIComponent(id)}`;
    });
}

function openEquipModal(id) {
  const item = EQUIPMENT_DATA[id];
  if (!item) return;

  const isSelected = selectedEquipSet.has(id);
  const modalBody = document.getElementById("equipModalBody");
  
  modalBody.innerHTML = `
    <div class="modal-grid">
      <div class="modal-media-col">
        <div class="modal-media-main" id="modalMainMedia">
          <img src="${cldOpt(item.gallery[0] || item.bgImage)}" id="modalMainImg" alt="${item.name}">
        </div>
        <div class="modal-gallery-thumbs">
          ${item.gallery.map((img, idx) => `
            <div class="modal-thumb ${idx === 0 ? 'active' : ''}" onclick="setModalMainImg('${img}', this)">
              <img src="${cldOpt(img)}" alt="Thumbnail ${idx + 1}" loading="${idx === 0 ? 'eager' : 'lazy'}">
            </div>
          `).join('')}
        </div>
      </div>

      <div class="modal-info-col">
        <div class="modal-header-block">
          <h3><span>${item.icon}</span> ${item.name}</h3>
          <p>${item.tagline}</p>
        </div>

        <div class="modal-spec-grid">
          <div class="modal-spec-box">
            <div class="lbl">👥 Crew &amp; Personnel</div>
            <div class="val">${item.crew}</div>
          </div>
          <div class="modal-spec-box">
            <div class="lbl">⏱️ Coverage Hours</div>
            <div class="val">${item.hours}</div>
          </div>
        </div>

        <div class="modal-section-title">🎥 Camera &amp; Gear Models Used</div>
        <ul class="modal-gear-list">
          ${item.gear.map(g => `<li>${g}</li>`).join('')}
        </ul>

        <div class="modal-section-title">🎁 Package Deliverables</div>
        <ul class="modal-gear-list" style="margin-bottom:0">
          ${item.deliverables.map(d => `<li>🎁 ${d}</li>`).join('')}
        </ul>

        <div class="modal-footer-cta">
          <button type="button" class="modal-add-btn ${isSelected ? 'in-cart' : ''}" onclick="toggleModalSelection('${item.id}')">
            ${isSelected ? '✓ Included in My Event Booking (Click to Remove)' : '+ Include this Equipment in My Booking'}
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("equipModal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function setModalMainImg(src, el) {
  const img = document.getElementById("modalMainImg");
  if (img) img.src = cldOpt(src);
  document.querySelectorAll(".modal-thumb").forEach(t => t.classList.remove("active"));
  if (el) el.classList.add("active");
}

function toggleModalSelection(id) {
  if (selectedEquipSet.has(id)) {
    selectedEquipSet.delete(id);
  } else {
    selectedEquipSet.add(id);
  }
  renderEquipCards();
  openEquipModal(id);
}

function closeEquipModal(e) {
  if (e && e.target !== document.getElementById("equipModal") && !e.target.classList.contains("equip-modal-close")) return;
  document.getElementById("equipModal").style.display = "none";
  document.body.style.overflow = "";
}

// Initialize equipment options section on page load
renderEquipCards();

// ── Pre-select equipment passed via URL param (from photography.html explore flow) ──
// e.g. booking.html?category=wedding&...&equip=drone  → booking a Wedding package with
// Drone Videography queued as an add-on: Drone card is auto-selected & scrolled to.
// directBookEquip() links (booking.html?category=drone&...&equip=drone) book the
// equipment item itself as the PRIMARY product — category === equip there, so this
// must not fire, or the page would jump straight past its own product details.
(function preSelectEquipFromURL() {
  const equipParam = params.get("equip");
  if (!equipParam) return;                          // nothing to pre-select
  if (!EQUIPMENT_DATA[equipParam]) return;          // unknown id — skip silently
  if (equipParam === params.get("category")) return; // it's the primary product, not an add-on

  selectedEquipSet.add(equipParam);                 // mark as selected
  renderEquipCards();                               // re-render so card shows "✓ Added" state

  // Scroll the equipment section into view so user sees it highlighted
  setTimeout(() => {
    const section = document.getElementById("equipOptionsSection");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 400);
})();

// ── Authoritative product data (fetched by id, not trusted from this page's own URL) ──
// The applyProductData() call near the top of this file paints instantly from
// category/package/tier/price/feats in the link's query string, purely so the page
// isn't blank while this fetch is in flight. This is what actually decides what's
// shown and what goToBookingForm()/the confirm-booking submit send onward - a visitor
// hand-editing the URL's price or feats no longer changes anything real once this lands.
(function fetchAuthoritativeProduct() {
  if (!current.pid) return; // old-format link with no pid - keep showing the link's own values
  fetch(`${API_BASE}/api/catalog/product/${encodeURIComponent(current.pid)}`)
    .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
    .then(p => applyProductData({
      pkg: p.title,
      tier: p.tier || "",
      price: p.price,
      feat: p.feat || [],
      extra: p.extra || {},
      images: p.images && p.images.length ? p.images : resolvePackageImages(cat, p.tier),
    }))
    .catch(err => console.error("Failed to load the authoritative product record, showing the link's own values:", err));
})();

