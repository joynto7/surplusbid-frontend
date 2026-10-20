/** Articles for /blog. Written by the SurplusBid team; cover photos are free Unsplash images. */

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "tip"; text: string };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: "Buying guides" | "Selling guides" | "Marketplace" | "Market insights";
  cover: string;
  author: { name: string; role: string };
  publishedAt: string;
  readMinutes: number;
  tags: string[];
  body: BlogBlock[];
}

export const unsplash = (id: string, width = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

export const POSTS: BlogPost[] = [
  {
    slug: "how-to-inspect-a-used-cnc-machine",
    title: "How to inspect a used CNC machine before you bid",
    excerpt:
      "Spindle run-out, way wear and the control's alarm history tell you more than any photo. Here's the checklist our buyers take to pre-auction inspections.",
    category: "Buying guides",
    cover: unsplash("1717386255773-a456c611dc4e"),
    author: { name: "Jordan Ellis", role: "Marketplace Operations" },
    publishedAt: "2026-10-06",
    readMinutes: 6,
    tags: ["machinery", "inspection", "cnc"],
    body: [
      {
        type: "p",
        text: "A used machining center can save you 50 to 70 percent against new, but only if it cuts parts to tolerance the week it lands on your floor. Photos can't show spindle health or backlash, so most serious buyers either inspect in person or ask the seller for specific evidence. These are the checks that matter most.",
      },
      { type: "h2", text: "1. Run it under power" },
      {
        type: "p",
        text: "Ask the seller to warm the spindle up and run it through its speed range while you listen. Bearing noise that rises with rpm, or a spindle that runs noticeably hot after ten minutes, points to a rebuild in your near future. Most SurplusBid machinery sellers offer power-on inspection by appointment, and the listing says so.",
      },
      { type: "h2", text: "2. Measure, don't eyeball" },
      {
        type: "ul",
        items: [
          'Spindle run-out: a dial indicator on a test bar should read under 0.0002" near the nose.',
          'Backlash: reverse each axis against an indicator. More than 0.001" usually means worn ball screws or loose gibs.',
          "Way wear: look for scoring and check that the way covers aren't torn. Torn covers let chips into the ways.",
        ],
      },
      { type: "h2", text: "3. Read the control's history" },
      {
        type: "p",
        text: "The alarm log and the hour meters for power-on, spindle and cutting time tell you how the machine was really used. A machine with high power-on hours but low cutting hours often sat idle in a prototype shop, which is usually good news. Ask for the last ballbar or laser calibration report if one exists.",
      },
      {
        type: "tip",
        text: "Can't travel? Use the AI assistant on the lot page to ask what is included, then message the seller through support with the list above. Sellers who have nothing to hide answer specifically.",
      },
      { type: "h2", text: "4. Plan the move before you bid" },
      {
        type: "p",
        text: "Rigging a 10,000 lb machine safely costs real money, and power requirements vary. Confirm the voltage, the machine's footprint and your door clearance before you bid. Then build the move into your maximum bid so a good price doesn't turn into a bad deal.",
      },
    ],
  },
  {
    slug: "deposit-holds-explained",
    title: "Deposit holds explained: what's authorized, what's charged, and when it's released",
    excerpt:
      "Every bidder places a refundable hold before their first bid. Here's exactly how the hold works on your card, and why it makes auctions better for buyers too.",
    category: "Buying guides",
    cover: unsplash("1563013544-824ae1b704d3"),
    author: { name: "Priya Nair", role: "Buyer Success" },
    publishedAt: "2026-09-29",
    readMinutes: 4,
    tags: ["payments", "deposits", "stripe"],
    body: [
      {
        type: "p",
        text: "Before your first bid on a lot, SurplusBid asks you to authorize a deposit hold of 10% of the lot's starting price. It's the single biggest reason our auctions close at real prices: every bid comes from a business that has put money on the line.",
      },
      { type: "h2", text: "Authorized is not charged" },
      {
        type: "p",
        text: "A hold reserves funds on your card through Stripe without moving them. Your bank shows it as pending, and nothing settles unless you win. Card details are entered in Stripe's secure payment form and never touch SurplusBid's servers.",
      },
      { type: "h2", text: "What happens when the auction closes" },
      {
        type: "ul",
        items: [
          "If you don't win, the hold is released automatically when the lot closes. You don't need to do anything.",
          "If you win, the hold is captured and applied to your total, and you pay the remaining balance within 48 hours.",
          "If you miss the 48-hour deadline, the deposit is forfeited and the lot goes to the next-highest bidder.",
        ],
      },
      { type: "h2", text: "Why we ask for it" },
      {
        type: "p",
        text: "Without deposits, auctions attract placeholder bids that vanish at checkout, and sellers relist, losing weeks. Holds keep bidding honest, and that brings in better sellers with better lots. It's why the sell-through rate on SurplusBid stays high.",
      },
      {
        type: "tip",
        text: "Holds are per lot. If you're bidding on several lots at once, make sure your card limit covers all the holds together.",
      },
    ],
  },
  {
    slug: "why-anti-sniping-makes-auctions-fairer",
    title: "Why anti-sniping makes auctions fairer for everyone",
    excerpt:
      "A bid in the final two minutes adds two minutes to the clock. It sounds small, but it changes how people bid, and it gets sellers closer to true market value.",
    category: "Marketplace",
    cover: unsplash("1704265586142-db3e17d0dea0"),
    author: { name: "Jordan Ellis", role: "Marketplace Operations" },
    publishedAt: "2026-09-18",
    readMinutes: 4,
    tags: ["bidding", "fairness"],
    body: [
      {
        type: "p",
        text: "Sniping is the practice of bidding in the last seconds so nobody has time to respond. On fixed-end auctions, it works, and it pushes everyone to hold back until the end. The result is a final price set by reaction time rather than by how much the item is worth to each bidder.",
      },
      { type: "h2", text: "How SurplusBid's extension works" },
      {
        type: "p",
        text: "Any bid placed in the final two minutes pushes the close back by two minutes. A lot only closes after two quiet minutes with no new bids, so every bidder always gets a chance to respond.",
      },
      { type: "h2", text: "What changes for buyers" },
      {
        type: "ul",
        items: [
          "You can bid your real maximum earlier without being ambushed at the buzzer.",
          "Unstable connections and time zones matter less: there's always time to respond.",
          "Bidding wars stay possible, but they're decided by price, not latency.",
        ],
      },
      { type: "h2", text: "What changes for sellers" },
      {
        type: "p",
        text: "Final prices on lots with competitive closes typically land closer to the second-highest bidder's true limit. That's the closest an auction gets to fair market value, and it's why our sellers come back.",
      },
    ],
  },
  {
    slug: "what-is-a-used-forklift-worth",
    title: "What's a used forklift worth? Five factors that move the price",
    excerpt:
      "Two forklifts with the same capacity can sell $8,000 apart. Hours, mast, fuel type, tires and paperwork explain most of the gap.",
    category: "Market insights",
    cover: unsplash("1620388640785-892616248ec8"),
    author: { name: "Marcus Lee", role: "Seller Success" },
    publishedAt: "2026-09-04",
    readMinutes: 5,
    tags: ["vehicles", "forklifts", "pricing"],
    body: [
      {
        type: "p",
        text: "Forklifts are among the most liquid lots on SurplusBid, and they sell fast when they're priced right. Comparing sold results across our marketplace, five factors explain most of the difference in final prices.",
      },
      { type: "h2", text: "1. Hours, not age" },
      {
        type: "p",
        text: "A forklift's hour meter matters more than its model year. Under 8,000 hours is generally considered mid-life for an internal-combustion truck. Above 12,000, buyers start pricing in an engine or transmission overhaul.",
      },
      { type: "h2", text: "2. Mast and attachments" },
      {
        type: "p",
        text: "Triple-stage masts with free lift and an integrated side shift are worth far more than a basic two-stage mast, because they work in more warehouses. Fork positioners and clamps add value if the buyer handles that kind of load.",
      },
      { type: "h2", text: "3. Fuel type" },
      {
        type: "ul",
        items: [
          "LPG cushion-tire trucks are the most common and easiest to resell.",
          "Electric trucks fetch more when the battery is recent. Ask for its date and a load test.",
          "Diesel pneumatic-tire trucks command a premium in yards and lumber operations.",
        ],
      },
      { type: "h2", text: "4. Tires and brakes" },
      {
        type: "p",
        text: "Worn cushion tires cost $1,500 or more to replace, so buyers subtract that from their bid. A listing that states the tread remaining, as our best sellers do, removes the guesswork and lifts the final price.",
      },
      { type: "h2", text: "5. Paperwork" },
      {
        type: "p",
        text: "A current annual inspection report and service history are worth hundreds of dollars on their own, because they reduce the buyer's risk. If you're selling, put them in the photos.",
      },
      {
        type: "tip",
        text: "Sellers: the AI listing assistant suggests a starting price from comparable sold lots in the same category, so you can open at a level the market will meet.",
      },
    ],
  },
  {
    slug: "selling-idle-inventory-checklist",
    title: "Turning idle equipment into cash: a seller's checklist",
    excerpt:
      "Equipment depreciates while it sits. From photos to pickup windows, this is the process our most successful sellers follow for every lot.",
    category: "Selling guides",
    cover: unsplash("1553413077-190dd305871c"),
    author: { name: "Marcus Lee", role: "Seller Success" },
    publishedAt: "2026-08-21",
    readMinutes: 6,
    tags: ["selling", "listings", "photos"],
    body: [
      {
        type: "p",
        text: "Idle equipment costs you floor space, insurance and value every month it waits. Auctions turn it into cash on a fixed schedule, and a few hours of preparation makes a measurable difference to the final price.",
      },
      { type: "h2", text: "Before you list" },
      {
        type: "ul",
        items: [
          "Gather the facts buyers ask for first: hours, voltage, dimensions, service records and why it's being sold.",
          "Clean the equipment. Buyers read dirt as neglect.",
          "Decide on pickup logistics: dock access, forklift or crane help, and the removal window.",
        ],
      },
      { type: "h2", text: "Photos that sell" },
      {
        type: "p",
        text: "Shoot five photos in good light: a full overview, the nameplate, the control or dashboard showing hours, the wear points (tires, ways, seats) and anything included in the lot. Honest photos of wear build more trust than flattering angles.",
      },
      { type: "h2", text: "Pricing the lot" },
      {
        type: "p",
        text: "Set the starting price low enough to attract early bids, then protect yourself with a private reserve. Bid activity attracts more bidders. Lots that open too high often sit with no bids until the last day.",
      },
      { type: "h2", text: "During and after the auction" },
      {
        type: "ul",
        items: [
          "Answer buyer questions quickly. Unanswered questions usually become lower bids.",
          "When the lot sells, the winner pays through Stripe within 48 hours, and you see it under Earnings.",
          "Have the paperwork ready at pickup, and ask the buyer for a review. Ratings show on every future lot.",
        ],
      },
    ],
  },
  {
    slug: "shipping-heavy-equipment-after-you-win",
    title: "Shipping heavy equipment after you win: rigging, freight and pickup",
    excerpt:
      "You won the lot. Now it has to get to your floor. A practical guide to booking riggers and carriers, and to avoiding the expensive surprises.",
    category: "Buying guides",
    cover: unsplash("1720811559395-3ed8d1b16649"),
    author: { name: "Priya Nair", role: "Buyer Success" },
    publishedAt: "2026-08-07",
    readMinutes: 5,
    tags: ["logistics", "freight", "pickup"],
    body: [
      {
        type: "p",
        text: "Every SurplusBid lot lists its pickup location, and unless the listing says otherwise, the buyer arranges collection after paying the balance. For pallets of chairs that's a box truck. For a 12,000 lb machining center, it's a project.",
      },
      { type: "h2", text: "Match the move to the load" },
      {
        type: "ul",
        items: [
          "Palletized goods under 2,000 lb: a box truck with a liftgate, or a less-than-truckload (LTL) carrier.",
          "Forklifts, carts and small machines: a flatbed or step-deck trailer with straps and edge protection.",
          "Machine tools and anything top-heavy: a licensed rigger with skates, a gantry or a crane, plus a flatbed.",
        ],
      },
      { type: "h2", text: "Ask the seller three questions" },
      {
        type: "p",
        text: "What loading help is on site (a dock, a forklift, an overhead crane)? What are the pickup hours and the removal deadline? Does anything need disconnecting by a licensed technician first, such as gas lines, hard-wired power or refrigerant? The answers decide who you hire.",
      },
      { type: "h2", text: "Protect the equipment in transit" },
      {
        type: "p",
        text: "Machine tools should travel with their axes locked and secured according to the manufacturer's shipping procedure. Laser heads and spindles need extra care. Photograph the equipment before loading so any damage claim has evidence.",
      },
      {
        type: "tip",
        text: "If something arrives damaged or not as described, open a dispute from your dashboard. An admin reviews it with both parties and records a resolution.",
      },
    ],
  },
];

export function postBySlug(slug: string) {
  return POSTS.find((p) => p.slug === slug) ?? null;
}
