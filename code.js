function main() {
  var OLD_YEAR = "write_old_year";
  var NEW_YEAR = "write_new_year";
  var SPREADSHEET_ID = "paste_your_google_sheet_id";
  var SHEET_NAME = "RSA Updates";

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

    headlines.forEach(function(h) {
      var newText = h.text;
      if (h.text.indexOf(OLD_YEAR) !== -1) {
        newText = h.text.replace(new RegExp(OLD_YEAR, "g"), NEW_YEAR);
        hasChange = true;

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

    if (hasChange) {
      var adGroup = ad.getAdGroup();
      ad.remove();

      var builder = adGroup.newAd().responsiveSearchAdBuilder();
      builder.withFinalUrl(finalUrl);

      updatedHeadlines.forEach(function(h) {
        h.pinnedField
          ? builder.addHeadline(h.text, h.pinnedField)
          : builder.addHeadline(h.text);
      });

      descriptions.forEach(function(d) {
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
