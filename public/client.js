// Human-readable local date/time (YYYY-MM-DD HH:mm:ss) in the user's timezone.
function formatTimestamp(date) {
  var pad = function (n) { return String(n).padStart(2, '0'); };
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
    ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
}

function updateOnlineStatus() {
  var offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  $('#offlineBanner').prop('hidden', !offline);
  return offline;
}

$(function () {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
      });
    }
  }
  updateOnlineStatus();
  refreshQuotes().catch(showError);

  $('form').submit(async function (event) {
    event.preventDefault();
    var button = $('#quoteButton').prop('disabled', true);
    try {
      var source = $('#quoteSource').val();
      var params = new URLSearchParams({ source: source });
      await loadJson('/generate?' + params.toString());
      await refreshQuotes();
    } catch (error) {
      showError(error);
    } finally {
      button.prop('disabled', false).focus();
    }
  });
});

async function loadJson(url) {
  var response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error('You appear to be offline. Please reconnect and try again.');
  }
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
  // Only display the original saved time; older quotes may not have one.
  if (quote.generatedAt) {
    var generatedAt = new Date(quote.generatedAt);
    if (!Number.isNaN(generatedAt.getTime())) {
      $('<time class="quote-timestamp"></time>')
        .attr('datetime', generatedAt.toISOString())
        .text('Generated ' + formatTimestamp(generatedAt)).appendTo(block);
    }
  }
  item.appendTo('ul#quotestream');
}