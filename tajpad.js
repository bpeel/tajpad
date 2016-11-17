var span_list = [];
var word_list = [];
var next_word = 0;
var end_word_re = /[^ ] /;
var word_ok = true;

var good_words = 0;
var bad_words = 0;
var good_characters = 0;

var STATE_WAITING_FIRST_WORD = 0;
var STATE_TIMING_WORDS = 1;
var STATE_EATING_WORD = 2;

var current_state = STATE_WAITING_FIRST_WORD;

var best_session_scores = [];

function get_word()
{
  var score = Math.random();
  var min = 0, max = Math.floor(words.length / 2);

  while (max > min) {
    var mid = Math.floor((min + max) / 2);
    var comp = words[mid * 2 + 1];
    if (score < comp)
      max = mid;
    else
      min = mid + 1;
  }

  return words[min * 2];
}

function fill_words(amount)
{
  var i;
  var p = document.getElementById("word-list");

  for (i = 0; i < amount; i++) {
    p.appendChild(document.createTextNode(" "));
    var word = get_word();
    word_list.push(word);

    var span = document.createElement("span");
    span_list.push(span);
    span.appendChild(document.createTextNode(word));
    p.appendChild(span);
  }
}

function check_end_of_line()
{
  var current_span = span_list[next_word];
  var word_p = current_span.parentNode;

  /* Assume we’ve reached the end of the first line if the current
   * word is positioned more than 3/8 of the way along the height of
   * the containing paragraph. */

  var word_p_rect = word_p.getBoundingClientRect();
  var threshold = word_p_rect.x + word_p_rect.height * 3 / 8;

  if (current_span.getBoundingClientRect().y < threshold)
    return;

  /* Keep deleting nodes until we find the current span. Count the
   * number of words in the process */

  var num_words = 0;

  while (word_p.firstChild != current_span) {
    if (word_p.firstChild.nodeType == Element.ELEMENT_NODE)
      num_words++;

    word_p.removeChild(word_p.firstChild);
  }

  span_list.splice(0, num_words);
  word_list.splice(0, num_words);
  next_word -= num_words;

  fill_words(num_words);
}

function cpm_to_wpm(cpm)
{
  return Math.round(cpm / 5.0);
}

function append_field(row, value)
{
  var td = document.createElement("td");
  td.appendChild(document.createTextNode(value));
  row.appendChild(td);
}

function update_score_table(scores, table)
{
  var first_element = table.firstElementChild;

  /* Get rid of everything after the header row */
  while (first_element.nextSibling)
    table.removeChild(first_element.nextSibling);

  for (var i = 0; i < scores.length; i++) {
    var record = scores[i];
    var row = document.createElement("tr");

    append_field(row,
                 record[0].toLocaleDateString() +
                 " " +
                 record[0].toLocaleTimeString());
    append_field(row, cpm_to_wpm(record[1]));
    append_field(row, record[1]);

    table.appendChild(row);
  }
}

function score_timeout_cb()
{
  current_state = STATE_EATING_WORD;

  var cpm = good_characters;
  var wpm = cpm_to_wpm(cpm);

  document.getElementById("score-cpm").innerHTML = cpm;
  document.getElementById("score-wpm").innerHTML = wpm;
  document.getElementById("score-good").innerHTML = good_words;
  document.getElementById("score-bad").innerHTML = bad_words;

  var record = [ new Date(), cpm ];
  var insert_point;

  for (insert_point = 0;
       insert_point < best_session_scores.length;
       insert_point++) {
    if (cpm >= best_session_scores[insert_point][1])
      break;
  }

  best_session_scores.splice(insert_point, 0, record);

  if (best_session_scores.length > 5)
    best_session_scores.splice(5, best_session_scores.length - 5);

  update_score_table(best_session_scores,
                     document.getElementById("score-session"));
}

function start_timing()
{
  current_state = STATE_TIMING_WORDS;
  good_words = 0;
  bad_words = 0;
  good_characters = 0;

  setTimeout(score_timeout_cb, 60000);
}

function word_changed(word_input)
{
  var value = word_input.value;

  if (current_state == STATE_WAITING_FIRST_WORD &&
      value.length > 0)
    start_timing();

  if (end_word_re.test(value)) {
    value = value.substring(0, value.length - 1);

    var result = value == word_list[next_word];

    span_list[next_word].className = result ? "good" : "bad";

    if (result) {
      good_words++;
      good_characters += word_list[next_word].length + 1;
    } else {
      bad_words++;
    }

    next_word++;
    span_list[next_word].className = "next";

    word_input.value = "";
    word_ok = true;

    check_end_of_line();

    if (current_state == STATE_EATING_WORD)
      current_state = STATE_WAITING_FIRST_WORD;
  } else if (word_list[next_word].substring(0, value.length) == value) {
    if (!word_ok) {
      span_list[next_word].className = "next";
      word_ok = true;
    }
  } else {
    if (word_ok) {
      span_list[next_word].className = "error";
      word_ok = false;
    }
  }
}

function initialise()
{
  fill_words(100);
  span_list[0].className = "next";

  var word_input = document.getElementById("word-input");
  word_input.oninput = function() { word_changed(word_input) };
}

window.onload = initialise;
