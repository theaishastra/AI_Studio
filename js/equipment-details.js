
/* ============ DATA (one entry per Equipment item) ============
   `gallery` images left blank ("") for items with no real photos shot yet —
   the gallery card renders a placeholder swatch instead of a broken/wrong image;
   just fill in the path once real photos are available, no other change needed. */
// ---------- Cloudinary auto-format/auto-quality helper ----------
function cldOpt(url) {
  // Cloudinary account has Strict Transformations enabled — any on-the-fly
  // transform (even a plain resize) 400s. No-op until that's turned off.
  // Locally-uploaded (admin Media Library) images are relative /media/<file>
  // paths served by FastAPI itself - route them through the same backend
  // origin every fetch() on this page already uses, or they resolve against
  // whatever's hosting this static page instead and 404.
  if (url && url.startsWith('/media/')) return `${window.SAI_API_BASE || "http://localhost:8000"}${url}`;
  // js/shared/thumb-map.js is a static url -> thumbnail-url lookup generated
  // ahead of time by scripts/generate_thumbnails.py (Pillow, no runtime proxy or
  // redirect). Falls back to the full-size original for anything not in it
  // (a data:/blob: URI, a localhost dev URL, or a newer image the script hasn't
  // been re-run for yet).
  if (!url || url.startsWith('data:') || url.startsWith('blob:') || /^https?:\/\/(localhost|127\.0\.0\.1)/.test(url)) return url;
  return (window.THUMB_MAP && window.THUMB_MAP[url]) || url;
}

const ITEMS = {
  drone: {
    name: "Drone Videography", icon: "🛸",
    tagline: "Breathtaking aerial photography and videography for weddings, events, and venues — captured in stunning 4K.",
    highlights: [
      { icon: "🎯", title: "4K Ultra HD Quality", sub: "Crystal clear aerial footage" },
      { icon: "🎬", title: "Cinematic Shots", sub: "Smooth movements & angles" },
      { icon: "🧑‍✈️", title: "Professional Team", sub: "Experienced drone pilots" },
    ],
    gallery: [
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/drone_1.jpg", caption: "Wedding Aerial View", video: true },
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/drone_2.jpg", caption: "Beach Pre-Wedding Shoot", video: true },
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/drone_3.jpg", caption: "Venue Flyover", video: true },
    ],
    whatWeOffer: [
      { icon: "🚁", title: "Aerial Videography", desc: "High quality aerial videos captured with precision." },
      { icon: "🎥", title: "Cinematic Shots", desc: "Creative angles and cinematic movements." },
      { icon: "📍", title: "Venue Coverage", desc: "Complete coverage of your venue from above." },
      { icon: "🌙", title: "Day & Night Shoot", desc: "Stunning shots captured anytime." },
      { icon: "🎞️", title: "Edited Highlights", desc: "Professionally edited highlight videos." },
      { icon: "☁️", title: "Raw Footage", desc: "Raw clips available on request." },
    ],
    equipment: [
      { icon: "🛸", title: "Professional Drone", desc: "High performance drones for stable and safe flights." },
      { icon: "📷", title: "4K Cinematic Camera", desc: "Capture every detail in ultra HD quality." },
      { icon: "🎚️", title: "3-Axis Gimbal", desc: "Smooth and stable footage in every movement." },
      { icon: "🧳", title: "Long-Flight Batteries", desc: "Extended flight time for complete event coverage." },
    ],
    perfectFor: ["Weddings", "Receptions", "Pre-Weddings", "Events", "Corporate Events", "Venues", "Festivals & Celebrations"],
    whyChooseUs: ["Experienced & Certified Drone Pilots", "High Quality 4K Equipment", "Creative Cinematic Shots", "Timely Delivery", "Affordable Packages", "Safe & Reliable Service"],
  },
  outdoor: {
    name: "Outdoor Photography", icon: "🏞️",
    tagline: "Scenic, natural-light portrait sessions at beautiful outdoor locations around the city.",
    highlights: [
      { icon: "🌅", title: "Natural Light Mastery", sub: "Soft, flattering outdoor tones" },
      { icon: "🗺️", title: "Scenic Locations", sub: "Curated picturesque spots" },
      { icon: "🎨", title: "Creative Direction", sub: "Posing & styling guidance" },
    ],
    gallery: [
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/outdoor_1.jpg", caption: "Golden Hour Portrait", video: false },
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/outdoor_2.jpg", caption: "Nature Trail Session", video: false },
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/outdoor_3.jpg", caption: "Lake View Shoot", video: false },
    ],
    whatWeOffer: [
      { icon: "📷", title: "Portrait Sessions", desc: "Individual & solo portraits in natural settings." },
      { icon: "💑", title: "Couple Shoots", desc: "Romantic sessions at scenic locations." },
      { icon: "🗺️", title: "Location Scouting", desc: "Hand-picked outdoor spots for your shoot." },
      { icon: "🌇", title: "Golden Hour Shoots", desc: "Soft, warm light for flattering portraits." },
      { icon: "🖼️", title: "Edited Galleries", desc: "Professionally retouched digital galleries." },
      { icon: "🖨️", title: "Print-Ready Files", desc: "High-resolution files ready for printing." },
    ],
    equipment: [
      { icon: "📷", title: "DSLR Camera", desc: "Professional-grade cameras for crisp detail." },
      { icon: "🔍", title: "Prime Lens Kit", desc: "Sharp, wide-aperture lenses for depth." },
      { icon: "💡", title: "Reflector & Diffuser", desc: "Soft, even natural lighting control." },
      { icon: "🎚️", title: "Lightweight Tripod", desc: "Stable shots on any terrain." },
    ],
    perfectFor: ["Portraits", "Couples", "Family Shoots", "Fashion Shoots", "Nature Lovers", "Solo Shoots"],
    whyChooseUs: ["Experienced Outdoor Photographers", "High-Res Professional Equipment", "Creative Natural Light Shots", "Timely Delivery", "Affordable Packages", "Safe & Reliable Service"],
  },
  video: {
    name: "Videography", icon: "🎥",
    tagline: "Cinematic films and highlight reels that bring your story to life, from ceremony to celebration.",
    highlights: [
      { icon: "🎬", title: "Cinematic Storytelling", sub: "Film-quality narrative editing" },
      { icon: "🎧", title: "Custom Sound Design", sub: "Background score & titles" },
      { icon: "⚡", title: "Fast Turnaround", sub: "Same-day highlight reels" },
    ],
    gallery: [
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/video_1.jpg", caption: "Wedding Highlight Reel", video: true },
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/video_2.jpg", caption: "Cinematic Love Story", video: true },
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/video_3.jpg", caption: "Same-Day Edit Preview", video: true },
    ],
    whatWeOffer: [
      { icon: "🎞️", title: "Highlight Films", desc: "Short, emotion-packed highlight reels." },
      { icon: "🎥", title: "Full Ceremony Coverage", desc: "Complete multi-camera event coverage." },
      { icon: "🛸", title: "Drone Integration", desc: "Aerial shots woven into your film." },
      { icon: "⚡", title: "Same-Day Edits", desc: "A quick teaser cut, ready the same day." },
      { icon: "🎵", title: "Custom Music Score", desc: "Background music matched to your story." },
      { icon: "📀", title: "4K Delivery", desc: "Full film delivered in crisp 4K." },
    ],
    equipment: [
      { icon: "🎥", title: "Cinema Camera", desc: "Professional cinema-grade video cameras." },
      { icon: "🎚️", title: "Gimbal Stabilizer", desc: "Smooth, shake-free moving shots." },
      { icon: "🎙️", title: "Wireless Mics", desc: "Crisp audio for vows and speeches." },
      { icon: "💡", title: "LED Lighting Kit", desc: "Consistent lighting in any venue." },
    ],
    perfectFor: ["Weddings", "Pre-Weddings", "Birthdays", "Corporate Events", "Events", "Festivals"],
    whyChooseUs: ["Experienced Cinematic Videographers", "Professional 4K Equipment", "Creative Storytelling", "Timely Delivery", "Affordable Packages", "Safe & Reliable Service"],
  },
  album: {
    name: "Album Designing", icon: "📔",
    tagline: "Premium, lay-flat photo albums designed to keep your favourite memories forever.",
    highlights: [
      { icon: "📔", title: "Premium Materials", sub: "Lay-flat, leather-bound pages" },
      { icon: "🎨", title: "Custom Design", sub: "Tailored layouts & themes" },
      { icon: "✨", title: "Gold Foil Finish", sub: "Elegant embossed detailing" },
    ],
    gallery: [
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/album_1.jpg", caption: "Lay-Flat Spread", video: false },
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/album_2.jpg", caption: "Leather Bound Cover", video: false },
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/album_3.jpg", caption: "Gold Foil Embossing", video: false },
    ],
    whatWeOffer: [
      { icon: "🎨", title: "Custom Layouts", desc: "Page designs tailored to your story." },
      { icon: "📖", title: "Lay-Flat Pages", desc: "Panoramic spreads with no center crease." },
      { icon: "🧵", title: "Leather/Fabric Covers", desc: "Premium cover material options." },
      { icon: "✨", title: "Gold Foil Embossing", desc: "Elegant embossed names & titles." },
      { icon: "🖼️", title: "Canvas Prints", desc: "Statement prints for your favourite shots." },
      { icon: "📚", title: "Mini Album Sets", desc: "Pocket-sized albums for gifting." },
    ],
    equipment: [
      { icon: "🖨️", title: "Studio Print Press", desc: "Archival-quality color printing." },
      { icon: "📗", title: "Lay-Flat Binder", desc: "Seamless, durable album binding." },
      { icon: "✨", title: "Foil Embossing Tool", desc: "Precision gold/silver foil detailing." },
      { icon: "🖥️", title: "Color Calibrated Monitor", desc: "True-to-life color accuracy." },
    ],
    perfectFor: ["Weddings", "Pre-Weddings", "Baby Milestones", "Birthdays", "House Warming", "Anniversaries"],
    whyChooseUs: ["Experienced Album Designers", "Premium Print Materials", "Creative Custom Layouts", "Timely Delivery", "Affordable Packages", "Safe & Reliable Service"],
  },
  traditionalphoto: {
    name: "Traditional Photography", icon: "🪔",
    tagline: "Timeless, ritual-focused photography that honors every custom and ceremony.",
    highlights: [
      { icon: "🪔", title: "Ritual-Focused Coverage", sub: "Every custom & ceremony captured" },
      { icon: "📿", title: "Cultural Expertise", sub: "Deep understanding of traditions" },
      { icon: "🖼️", title: "Classic Framing", sub: "Timeless, formal compositions" },
    ],
    gallery: [
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/traditional-photography-1.png", caption: "Ceremony Rituals", video: false },
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/traditional-photography-2.png", caption: "Family Blessings", video: false },
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/traditional-photography-3.png", caption: "Traditional Portraits", video: false },
    ],
    whatWeOffer: [
      { icon: "🪔", title: "Ritual Photography", desc: "Every ceremony moment captured respectfully." },
      { icon: "👨‍👩‍👧‍👦", title: "Family Portraits", desc: "Formal group portraits for the whole family." },
      { icon: "📿", title: "Ceremony Coverage", desc: "Complete coverage from start to finish." },
      { icon: "🖼️", title: "Formal Group Shots", desc: "Classic, well-composed group photography." },
      { icon: "💾", title: "Digital Albums", desc: "Beautifully organised digital delivery." },
      { icon: "🖨️", title: "Printed Photos", desc: "Ready-to-frame printed keepsakes." },
    ],
    equipment: [
      { icon: "📷", title: "DSLR Camera", desc: "Professional cameras for sharp detail." },
      { icon: "💡", title: "Studio Lighting", desc: "Even, flattering ceremony lighting." },
      { icon: "🔍", title: "Prime Lenses", desc: "Crisp portraits in any indoor light." },
      { icon: "🎚️", title: "Tripod Setup", desc: "Steady shots for formal group photos." },
    ],
    perfectFor: ["Weddings", "Housewarming", "Saree Functions", "Naming Ceremonies", "Religious Events", "Family Gatherings"],
    whyChooseUs: ["Experienced Traditional Photographers", "Deep Cultural Knowledge", "Respectful Ritual Coverage", "Timely Delivery", "Affordable Packages", "Safe & Reliable Service"],
  },
  traditionalvideo: {
    name: "Traditional Videography", icon: "🎞️",
    tagline: "Authentic ceremony videography that preserves every ritual, chant, and blessing.",
    highlights: [
      { icon: "🎥", title: "Full Ritual Coverage", sub: "Every ceremony from start to end" },
      { icon: "🎙️", title: "Clear Audio Capture", sub: "Mantras & speeches recorded crisply" },
      { icon: "🕯️", title: "Respectful Filming", sub: "Non-intrusive, traditional approach" },
    ],
    gallery: [
      { img: "", caption: "Ceremony Film", video: true },
      { img: "", caption: "Ritual Documentation", video: true },
      { img: "", caption: "Family Blessing Reel", video: true },
    ],
    whatWeOffer: [
      { icon: "🎥", title: "Full Ceremony Filming", desc: "Complete video record of every ritual." },
      { icon: "📹", title: "Multi-Camera Coverage", desc: "Multiple angles for a complete story." },
      { icon: "🎙️", title: "Mantra Audio Capture", desc: "Clear recording of chants & speeches." },
      { icon: "🎞️", title: "Highlight Edits", desc: "A short, shareable ceremony highlight." },
      { icon: "⚡", title: "Same-Day Preview", desc: "A quick preview clip, ready fast." },
      { icon: "💾", title: "Digital Delivery", desc: "Full footage delivered digitally." },
    ],
    equipment: [
      { icon: "🎥", title: "Multi-Camera Setup", desc: "Multiple cameras for full coverage." },
      { icon: "🎙️", title: "Directional Microphones", desc: "Crisp capture of rituals & speech." },
      { icon: "💡", title: "LED Lighting Kit", desc: "Reliable lighting for indoor ceremonies." },
      { icon: "🎚️", title: "Steady Tripod Rigs", desc: "Smooth, stable ceremony footage." },
    ],
    perfectFor: ["Weddings", "Housewarming", "Saree Functions", "Naming Ceremonies", "Religious Events", "Family Gatherings"],
    whyChooseUs: ["Experienced Traditional Videographers", "Reliable Multi-Camera Setup", "Respectful Ritual Filming", "Timely Delivery", "Affordable Packages", "Safe & Reliable Service"],
  },
  cinematicvideo: {
    name: "Cinematic Videography", icon: "🎬",
    tagline: "Film-style storytelling with cinematic color, sound, and emotion.",
    highlights: [
      { icon: "🎬", title: "Film-Grade Visuals", sub: "Cinema color grading & framing" },
      { icon: "🎼", title: "Emotional Storytelling", sub: "Custom score & narrative pacing" },
      { icon: "🏆", title: "Award-Style Editing", sub: "Festival-quality highlight films" },
    ],
    gallery: [
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/cinematic-videography-1.png", caption: "Cinematic Highlight Film", video: true },
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/cinematic-videography-2.png", caption: "Love Story Teaser", video: true },
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/cinematic-videography-3.png", caption: "Feature Film Edit", video: true },
    ],
    whatWeOffer: [
      { icon: "🎬", title: "Cinematic Highlight Films", desc: "Emotion-driven, film-style edits." },
      { icon: "🎞️", title: "Feature Films", desc: "Full-length cinematic event films." },
      { icon: "🛸", title: "Drone Integration", desc: "Aerial visuals woven into the story." },
      { icon: "🎨", title: "Color Grading", desc: "Cinema-grade color for every frame." },
      { icon: "🎼", title: "Custom Score", desc: "Music composed to match your story." },
      { icon: "📀", title: "4K/HDR Delivery", desc: "Delivered in stunning 4K/HDR." },
    ],
    equipment: [
      { icon: "🎥", title: "Cinema-Grade Camera", desc: "Professional cinema camera bodies." },
      { icon: "🔭", title: "Anamorphic Lenses", desc: "Wide, filmic look and depth." },
      { icon: "🎚️", title: "Gimbal & Sliders", desc: "Smooth, dynamic camera movement." },
      { icon: "🎙️", title: "Pro Audio Recorders", desc: "Studio-quality sound capture." },
    ],
    perfectFor: ["Weddings", "Pre-Weddings", "Short Films", "Corporate Events", "Music Videos", "Brand Films"],
    whyChooseUs: ["Experienced Cinematic Filmmakers", "Film-Grade Equipment", "Emotional Storytelling", "Timely Delivery", "Affordable Packages", "Safe & Reliable Service"],
  },
  candidphoto: {
    name: "Candid Photography", icon: "📷",
    tagline: "Natural, unposed moments captured exactly as they happen.",
    highlights: [
      { icon: "📷", title: "Unscripted Moments", sub: "Real emotions, zero posing" },
      { icon: "🤫", title: "Discreet Shooting", sub: "Blends into the background" },
      { icon: "⚡", title: "Quick Reflexes", sub: "Never misses the moment" },
    ],
    gallery: [
      { img: "", caption: "Candid Laughter", video: false },
      { img: "", caption: "Unposed Family Moment", video: false },
      { img: "", caption: "Spontaneous Celebration", video: false },
    ],
    whatWeOffer: [
      { icon: "💍", title: "Candid Wedding Coverage", desc: "Real, unposed wedding-day moments." },
      { icon: "😄", title: "Guest Reactions", desc: "Genuine reactions and candid laughs." },
      { icon: "🎬", title: "Behind-the-Scenes", desc: "The quiet, in-between moments too." },
      { icon: "❤️", title: "Emotional Moments", desc: "Tears, hugs, and heartfelt exchanges." },
      { icon: "⚡", title: "Fast Editing", desc: "Quick turnaround on edited galleries." },
      { icon: "🖼️", title: "Digital Galleries", desc: "Beautifully curated online galleries." },
    ],
    equipment: [
      { icon: "📷", title: "Silent Shutter Camera", desc: "Discreet, near-silent shooting." },
      { icon: "🔭", title: "Telephoto Lens", desc: "Candid shots from a comfortable distance." },
      { icon: "🔍", title: "Prime Lens Kit", desc: "Sharp low-light candid portraits." },
      { icon: "⚡", title: "Portable Flash", desc: "Fill light for indoor candid shots." },
    ],
    perfectFor: ["Weddings", "Receptions", "Birthdays", "Corporate Events", "Festivals", "Family Functions"],
    whyChooseUs: ["Experienced Candid Photographers", "Fast & Discreet Shooting", "Genuine Emotional Capture", "Timely Delivery", "Affordable Packages", "Safe & Reliable Service"],
  },
  ledscreens: {
    name: "LED Screens", icon: "💡",
    tagline: "High-brightness LED screen rentals for weddings, stages, and live events.",
    highlights: [
      { icon: "💡", title: "High Brightness Panels", sub: "Vivid visuals in any lighting" },
      { icon: "📡", title: "Live Feed Ready", sub: "Seamless stage & camera integration" },
      { icon: "🛠️", title: "On-Site Setup Team", sub: "Full installation & operation" },
    ],
    gallery: [
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/led-screens-1.png", caption: "Stage LED Backdrop", video: false },
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/led-screens-2.png", caption: "Live Event Screen", video: false },
      { img: "https://pub-0f96bbc0f4a649b7b396578fc5db875b.r2.dev/sai_kumar_studio/Photography_assets/assets/portfolio/led-screens-3.png", caption: "Wedding Stage Display", video: false },
    ],
    whatWeOffer: [
      { icon: "💡", title: "LED Wall Rental", desc: "Large-format LED walls for any stage." },
      { icon: "📡", title: "Live Video Feed", desc: "Real-time camera feed onto the screen." },
      { icon: "🖥️", title: "Stage Backdrop Screens", desc: "Custom backdrop visuals for the stage." },
      { icon: "🛠️", title: "On-Site Technicians", desc: "Full setup, operation & teardown." },
      { icon: "🎨", title: "Custom Content Display", desc: "Photos, videos & graphics on screen." },
      { icon: "🔊", title: "Sound Integration", desc: "Synced audio-visual presentation." },
    ],
    equipment: [
      { icon: "💡", title: "High-Res LED Panels", desc: "Bright, seamless modular panels." },
      { icon: "🖥️", title: "Video Processor", desc: "Smooth, synced content playback." },
      { icon: "🏗️", title: "Truss & Rigging", desc: "Secure mounting for any venue." },
      { icon: "🔌", title: "Signal & Sound Cables", desc: "Reliable, tangle-free connections." },
    ],
    perfectFor: ["Weddings", "Concerts", "Corporate Events", "Product Launches", "Festivals", "Award Shows"],
    whyChooseUs: ["Experienced Technical Team", "High-Brightness Equipment", "Reliable Live Feed Setup", "Timely Delivery", "Affordable Packages", "Safe & Reliable Service"],
  },
};

const PERFECT_ICONS = {
  "Weddings": "💍", "Receptions": "🥂", "Pre-Weddings": "💑", "Events": "🎉",
  "Corporate Events": "💼", "Venues": "🏛️", "Festivals & Celebrations": "🎊",
  "Portraits": "🧑", "Couples": "💑", "Family Shoots": "👨‍👩‍👧", "Fashion Shoots": "👗",
  "Nature Lovers": "🌿", "Solo Shoots": "🚶", "Birthdays": "🎂", "Festivals": "🎊",
  "Baby Milestones": "👶", "House Warming": "🏠", "Anniversaries": "💐",
  "Housewarming": "🏠", "Saree Functions": "🥻", "Naming Ceremonies": "👶",
  "Religious Events": "🛕", "Family Gatherings": "👨‍👩‍👧", "Short Films": "🎬",
  "Music Videos": "🎵", "Brand Films": "📽️", "Family Functions": "👨‍👩‍👧",
  "Concerts": "🎤", "Product Launches": "🚀", "Award Shows": "🏆",
};

/* ============ RENDER ============ */
const params = new URLSearchParams(location.search);
const itemId = params.get("item") || "";
const item = ITEMS[itemId];

if (!item) {
  /* unknown/missing item — send visitors back instead of showing a blank page */
  window.location.replace("photography.html");
} else {
  document.title = `${item.name} — Sai Kumar Digital Lab & Studio`;
  document.getElementById("crumbName").textContent = item.name;
  document.getElementById("dIco").textContent = item.icon;
  document.getElementById("dName").textContent = item.name;
  document.getElementById("dTagline").textContent = item.tagline;
  document.getElementById("galleryTitle").textContent = item.name.toUpperCase() + " GALLERY";
  document.getElementById("viewMoreBtn").href = "photography.html?category=" + encodeURIComponent(itemId);
  document.getElementById("bookTitle").textContent = "Book " + item.name.toUpperCase();

  document.getElementById("highlightsBar").innerHTML = item.highlights.map(h => `
    <div class="hl-item">
      <div class="hl-ico">${h.icon}</div>
      <div><h4>${h.title}</h4><p>${h.sub}</p></div>
    </div>`).join("");

  document.getElementById("galleryGrid").innerHTML = item.gallery.map(g => g.img ? `
    <div class="gal-card">
      <img src="${cldOpt(g.img)}" alt="${g.caption}" loading="lazy">
      <div class="gal-cap">${g.caption}</div>
    </div>` : `
    <div class="gal-card gal-card--empty">
      <span class="gal-empty-ico">🖼️</span>
      <div class="gal-cap-plain">${g.caption}</div>
      <div class="gal-cap-sub">Photo coming soon</div>
    </div>`).join("");

  document.getElementById("offerGrid").innerHTML = item.whatWeOffer.map(o => `
    <div class="offer-card">
      <div class="offer-ico">${o.icon}</div>
      <h4>${o.title}</h4>
      <p>${o.desc}</p>
    </div>`).join("");

  document.getElementById("equipList").innerHTML = item.equipment.map(e => `
    <div class="equip-row">
      <div class="equip-ico">${e.icon}</div>
      <div><h4>${e.title}</h4><p>${e.desc}</p></div>
    </div>`).join("");

  document.getElementById("perfectGrid").innerHTML = item.perfectFor.map(label => `
    <div class="perfect-item">
      <div class="perfect-ico">${PERFECT_ICONS[label] || "✨"}</div>
      <span>${label}</span>
    </div>`).join("");

  document.getElementById("whyList").innerHTML = item.whyChooseUs.map(w => `
    <div class="why-item"><span class="why-tick">✓</span>${w}</div>`).join("");

  /* Event Type options mirror this service's "Perfect For" list — keeps the
     dropdown relevant to the item without needing separate authoring */
  const evSel = document.getElementById("bfEventType");
  item.perfectFor.concat(["Other"]).forEach(label => {
    const o = document.createElement("option");
    o.value = label; o.textContent = label;
    evSel.appendChild(o);
  });

  const todayISO = new Date().toISOString().split("T")[0];
  document.getElementById("bfDate").min = todayISO;
}

function markInvalid(fieldEl, bad) {
  fieldEl.closest(".bf-field").classList.toggle("invalid", bad);
}

function submitEnquiry() {
  const nameEl = document.getElementById("bfName");
  const phoneEl = document.getElementById("bfPhone");
  const emailEl = document.getElementById("bfEmail");
  const typeEl = document.getElementById("bfEventType");
  const dateEl = document.getElementById("bfDate");

  const name = nameEl.value.trim();
  const phone = phoneEl.value.replace(/\D/g, "");
  const email = emailEl.value.trim();
  const eventType = typeEl.value;
  const date = dateEl.value;
  const location_ = document.getElementById("bfLocation").value.trim() || "—";
  const msg = document.getElementById("bfMsg").value.trim() || "—";

  let ok = true;
  markInvalid(nameEl, !name); if (!name) ok = false;
  // Same 10-digit Indian mobile pattern contact-us.js uses, so a booking
  // enquiry can't be filed with an obviously-fake number that a bare
  // length check would let through.
  const phoneOk = /^[6-9]\d{9}$/.test(phone.slice(-10)) && phone.length >= 10;
  markInvalid(phoneEl, !phoneOk); if (!phoneOk) ok = false;
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email); markInvalid(emailEl, !emailOk); if (!emailOk) ok = false;
  markInvalid(typeEl, !eventType); if (!eventType) ok = false;
  // dateEl.min blocks past dates in the picker UI, but that's just an HTML
  // attribute a visitor can edit in devtools - re-check it here so a
  // backdated enquiry can't slip through.
  const todayISO = new Date().toISOString().split("T")[0];
  const dateOk = !!date && date >= todayISO;
  markInvalid(dateEl, !dateOk); if (!dateOk) ok = false;

  if (!ok) {
    const invalidEl = document.querySelector(".bf-field.invalid input,.bf-field.invalid select");
    if (invalidEl) { invalidEl.scrollIntoView({ behavior: "smooth", block: "center" }); invalidEl.focus(); }
    return;
  }

  const q = new URLSearchParams({
    category: itemId,
    package: item.name + " Enquiry",
    tier: "", price: "",
    name, phone, email,
    venue: location_,
    msg: `Event Type: ${eventType}\n${msg}`,
    date,
  });
  window.location.href = "booking-confirmation.html?" + q.toString();
}
