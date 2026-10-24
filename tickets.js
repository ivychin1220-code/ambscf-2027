/* 票務狀態唯一來源。
   一般票售價 price 已由 Ivy 確認為 4680。
   把 general.enabled 設成 false，即使到了開賣日也不顯示價格與購買鈕。 */
(function (global) {
  var CONFIG = {
    buyUrl: "https://kktix.com/events/culturalfestival2027/registrations/new",
    eventUrl: "https://iszn.kktix.cc/events/culturalfestival2027",
    earlyBird: {
      enabled: true,
      price: 3980,
      start: "2026-10-01T00:00:00+08:00",
      end: "2026-10-31T23:59:59+08:00"
    },
    general: {
      enabled: true,
      price: 4680,
      start: "2026-11-01T00:00:00+08:00",
      end: "2027-01-02T23:59:59+08:00"
    }
  };

  function nowMs() {
    var search = "";
    try { search = (global.location && global.location.search) || ""; } catch (e) {}
    var q = new URLSearchParams(search).get("now");
    if (q) {
      var t = Date.parse(q);
      if (!isNaN(t)) return t;
    }
    return Date.now();
  }

  function statusOf(ticket, now) {
    if (!ticket || !ticket.enabled) return "disabled";
    if (now < Date.parse(ticket.start)) return "upcoming";
    if (now > Date.parse(ticket.end)) return "ended";
    return "onsale";
  }

  function money(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function taipeiParts(ms) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Taipei",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date(ms));
  }

  function part(parts, type) {
    return parts.find(function (p) { return p.type === type; }).value;
  }

  function shortDeadline(iso) {
    var parts = taipeiParts(Date.parse(iso));
    return part(parts, "month") + "/" + part(parts, "day") + " " + part(parts, "hour") + ":" + part(parts, "minute");
  }

  function daysUntil(endIso, now) {
    var endParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.parse(endIso)));
    var today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
    return Math.max(0, Math.round((Date.parse(endParts + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86400000));
  }

  function dinnerOfferText(now) {
    var early = statusOf(CONFIG.earlyBird, now);
    var general = statusOf(CONFIG.general, now);
    if (early === "onsale") return "早鳥每人 NT$" + money(CONFIG.earlyBird.price) + "｜" + shortDeadline(CONFIG.earlyBird.end) + " 截止";
    if (general === "onsale") return "一般票每人 NT$" + money(CONFIG.general.price) + "｜" + shortDeadline(CONFIG.general.end) + " 截止";
    if (general === "upcoming" || general === "disabled") return "一般票即將開賣";
    return "晚宴線上售票已截止";
  }

  function dinnerFaqHtml(now) {
    var early = statusOf(CONFIG.earlyBird, now);
    var general = statusOf(CONFIG.general, now);
    var link = '<a href="' + CONFIG.buyUrl + '" target="_blank" rel="noopener" style="color:var(--cyan)">KKTIX 售票頁</a>';
    var perks = "包含晚宴一般席位，可享十道客家宴席、吉董演唱、幾米魔術與晚宴抽獎。";
    if (early === "onsale") {
      var save = CONFIG.general.enabled ? "，比一般票省 NT$" + money(CONFIG.general.price - CONFIG.earlyBird.price) : "";
      return "只想參加開運晚宴，推薦選早鳥票，每人 NT$" + money(CONFIG.earlyBird.price) + "。" + shortDeadline(CONFIG.earlyBird.end) + " 前購票" + save + "，限前 500 席。" + perks;
    }
    if (general === "onsale") {
      return "早鳥票已於 " + shortDeadline(CONFIG.earlyBird.end) + " 結束。只想參加開運晚宴，請選一般票，每人 NT$" + money(CONFIG.general.price) + "，" + shortDeadline(CONFIG.general.end) + " 截止。請至 " + link + " 購買。" + perks;
    }
    if (general === "upcoming") {
      return "早鳥票已結束。一般票即將開賣，預計 " + shortDeadline(CONFIG.general.start) + "。價格與購買方式開放後請見 " + link + "。";
    }
    if (general === "disabled") {
      return "早鳥票已結束。一般票即將開賣。價格與開賣時間以 " + link + " 與官方公告為準。";
    }
    return "早鳥票與一般票的線上販售皆已結束。其他仍在販售的方案請見 " + link + "。";
  }

  function schemaOffer(ticket, name, now) {
    var st = statusOf(ticket, now);
    if (st === "disabled") return null;
    var availability = st === "onsale" ? "https://schema.org/InStock" : st === "ended" ? "https://schema.org/SoldOut" : "https://schema.org/PreOrder";
    var offer = {
      "@type": "Offer",
      name: name,
      priceCurrency: "TWD",
      availability: availability,
      url: CONFIG.buyUrl,
      validFrom: ticket.start,
      validThrough: ticket.end
    };
    if (st === "onsale" || st === "ended") offer.price = String(ticket.price);
    return offer;
  }

  function syncJsonLd(now) {
    var el = global.document && global.document.getElementById("event-jsonld");
    if (!el) return;
    var data = JSON.parse(el.textContent);
    var event = data["@graph"].filter(function (node) { return node["@type"] === "Event"; })[0];
    if (!event || !event.offers) return;
    var rest = event.offers.filter(function (offer) {
      return offer.name !== "早鳥票（開運晚宴）" && offer.name !== "一般票（開運晚宴）";
    });
    var early = schemaOffer(CONFIG.earlyBird, "早鳥票（開運晚宴）", now);
    var general = schemaOffer(CONFIG.general, "一般票（開運晚宴）", now);
    event.offers = [early, general].filter(Boolean).concat(rest);
    event.offers.forEach(function (offer) { offer.url = CONFIG.buyUrl; });
    el.textContent = JSON.stringify(data);
  }

  function syncBuyLinks() {
    if (!global.document) return;
    global.document.querySelectorAll("[data-kktix-buy]").forEach(function (a) { a.href = CONFIG.buyUrl; });
  }

  function showPreview(now) {
    if (!global.document) return;
    var search = "";
    try { search = global.location.search || ""; } catch (e) {}
    var q = new URLSearchParams(search).get("now");
    if (!q || isNaN(Date.parse(q))) return;
    if (global.document.getElementById("time-preview")) return;
    var style = global.document.createElement("style");
    style.textContent = ".time-preview{position:fixed;top:68px;left:0;right:0;z-index:70;background:#2a2110;color:#f5d48a;text-align:center;padding:8px 16px;font-size:14px;line-height:1.5}";
    global.document.head.appendChild(style);
    var bar = global.document.createElement("div");
    bar.id = "time-preview";
    bar.className = "time-preview";
    bar.textContent = "時間預覽：" + q + "（只在網址帶 now 時出現）";
    global.document.body.prepend(bar);
  }

  function boot() {
    var now = nowMs();
    showPreview(now);
    syncBuyLinks();
    syncJsonLd(now);
    if (!global.document) return;
    var faq = global.document.getElementById("faq-dinner-answer");
    if (faq) faq.innerHTML = dinnerFaqHtml(now);
    var offer = global.document.getElementById("banquetOffer");
    if (offer) offer.textContent = dinnerOfferText(now);
  }

  global.FestivalTickets = {
    config: CONFIG,
    nowMs: nowMs,
    statusOf: statusOf,
    money: money,
    shortDeadline: shortDeadline,
    daysUntil: daysUntil,
    dinnerOfferText: dinnerOfferText,
    dinnerFaqHtml: dinnerFaqHtml,
    schemaOffer: schemaOffer,
    syncBuyLinks: syncBuyLinks,
    boot: boot
  };
})(typeof window !== "undefined" ? window : globalThis);
