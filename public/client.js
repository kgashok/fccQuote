// Client-side only: remembers when each quote was first displayed (keyed by
// quote id) so re-renders of the list keep a stable timestamp per quote.
var quoteTimestamps = {};

// Human-readable local date/time (YYYY-MM-DD HH:mm:ss) in the user's timezone.
function formatTimestamp(date) {
  var pad = function (n) { return String(n).padStart(2, '0'); };
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
    ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
}

$(function () {
  refreshQuotes().catch(showError);

  $('form').submit(async function (event) {
    event.preventDefault();
    var button = $('#quoteButton').prop('disabled', true);
    try {
      await loadJson('/generate');
      await refreshQuotes();
    } catch (error) {
      showError(error);
    } finally {
      button.prop('disabled', false).focus();
    }
  });
});

async function loadJson(url) {
  var response = await fetch(url);
  if (!response.ok) {
    var body = await response.json().catch(function () { return {}; });
    throw new Error(body.error || 'Request failed (' + response.status + ')');
  }
  return response.json();
}

async function refreshQuotes() {
  var quotes = await loadJson('/responses');
  $('ul#quotestream').empty();
  quotes.forEach(addQuoteToDisplay);
}

function showError(error) {
  console.error(error);
  alert(error.message || 'Could not get a quote. Please try again.');
}

function clearTheBox() {
  $('ul#quotestream').empty();
}

function addQuoteToDisplay(quote) {
  var item = $('<li></li>');
  var share = $('<div id="share"></div>').appendTo(item);
  $('<a target="_blank" rel="noopener" id="t" title="Tweet this quote">Tweet</a>')
    .attr('href', 'https://twitter.com/intent/tweet?text=' +
      encodeURIComponent(quote.quoteText + ' - ' + quote.quoteAuthor))
    .appendTo(share);
  var block = $('<blockquote class="quote"></blockquote>').appendTo(item);
  $('<a target="_blank" rel="noopener" id="quote"></a>')
    .attr('href', quote.quoteLink).text(quote.quoteText).appendTo(block);
  block.append('<br>');
  $('<small></small>').append(
    $('<a target="_blank" rel="noopener"></a>')
      .attr('href', 'https://en.wikipedia.org/wiki/' + encodeURIComponent(quote.quoteAuthor))
      .text(quote.quoteAuthor)
  ).appendTo(block);
  // Stamp the quote the first time it is rendered, i.e. when it is generated
  // (or on first page load for quotes already stored); no backend storage.
  var now = new Date();
  if (!quoteTimestamps[quote.id]) {
    quoteTimestamps[quote.id] = { text: formatTimestamp(now), iso: now.toISOString() };
  }
  var stamp = quoteTimestamps[quote.id];
  $('<time class="quote-timestamp"></time>')
    .attr('datetime', stamp.iso).text('Generated ' + stamp.text).appendTo(block);
  item.appendTo('ul#quotestream');
}