function main() {
  // 🔁 CHANGE TEXT HERE 
  var OLD_TEXT = "paste_text_you_want_to_change";
  var NEW_TEXT = "paste_new_text";

  var SPREADSHEET_ID = "paste_your_sheet_GSheet_id";
  var SHEET_NAME = "paste_your_sheet_name";

  var sheet = getOrCreateSheet(SPREADSHEET_ID, SHEET_NAME);

  var adsIterator = AdsApp.ads()
    .withCondition("Type = RESPONSIVE_SEARCH_AD")
    .withCondition("Status = ENABLED")
    .get();

  while (adsIterator.hasNext()) {
    var ad = adsIterator.next();
    var rsa = ad.asType().responsiveSearchAd();

    var headlines = rsa.getHeadlines();
    var descriptions = rsa.getDescriptions();
    var finalUrl = ad.urls().getFinalUrl();

    var updatedHeadlines = [];
    var hasChange = false;

    headlines.forEach(function (h) {
      var newText = h.text;

      if (h.text.indexOf(OLD_TEXT) !== -1) {
        newText = h.text.replace(
          new RegExp(escapeRegex(OLD_TEXT), "g"),
          NEW_TEXT
        );
        hasChange = true;

        // ✅ Log only when change happens
        sheet.appendRow([
          new Date(),
          ad.getCampaign().getName(),
          ad.getAdGroup().getName(),
          h.text,
          newText,
          "UPDATED"
        ]);
      }

      updatedHeadlines.push({
        text: newText,
        pinnedField: h.pinnedField
      });
    });

    // 🔄 Rebuild RSA only if something changed
    if (hasChange) {
      var adGroup = ad.getAdGroup();
      ad.remove();

      var builder = adGroup.newAd().responsiveSearchAdBuilder();
      builder.withFinalUrl(finalUrl);

      updatedHeadlines.forEach(function (h) {
        h.pinnedField
          ? builder.addHeadline(h.text, h.pinnedField)
          : builder.addHeadline(h.text);
      });

      descriptions.forEach(function (d) {
        d.pinnedField
          ? builder.addDescription(d.text, d.pinnedField)
          : builder.addDescription(d.text);
      });

      builder.build();
    }
  }

  Logger.log("Finished. Results logged to Google Sheet.");
}

/* ---------- Helpers ---------- */

function getOrCreateSheet(spreadsheetId, sheetName) {
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.appendRow([
      "Timestamp",
      "Campaign",
      "Ad Group",
      "Old Headline",
      "New Headline",
      "Status"
    ]);
  }

  return sheet;
}

// ✅ Escapes special characters for regex safety
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
