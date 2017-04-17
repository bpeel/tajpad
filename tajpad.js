/*
 * Tajpad - A typing test website
 * Copyright (C) 2016  Neil Roberts
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
var best_ever_scores = [];

var score_history = [];
var SCORE_HISTORY_LENGTH = 20;

var timer_id;
var timer_element;
var timer_start_time;

var score_timeout_id;

var last_change_time;

function update_score_graph()
{
  var parts = [];

  for (var i = 0; i < score_history.length; i++) {
    var wpm = cpm_to_wpm(score_history[i]);
    parts.push((i == 0 ? "M " : "L ") + (i * 10) + "," + wpm);
  }

  var line = document.getElementById("score-graph-line");
  line.setAttribute("d", parts.join(" "));
}

function update_timer()
{
  var now = new Date();
  var diff = 60 - Math.round((now.getTime() -
                              timer_start_time.getTime()) / 1000);
  timer_element.innerHTML = diff;

  /* If nothing is typed for more than 5 seconds then give up on this
   * timing */
  if (now.getTime() - last_change_time.getTime() >= 5000)
    stop_timing();
}

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
  var threshold = word_p_rect.top + word_p_rect.height * 3 / 8;

  if (current_span.getBoundingClientRect().top < threshold)
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


function load_ever_scores()
{
  if (typeof(Storage) == "undefined")
    return;

  var s = localStorage.getItem("score-ever");

  if (s == null)
    return;

  var parts = s.split(" ");

  for (var i = 0; i < parts.length; i += 2) {
    record = [ new Date(parseInt(parts[i])), parseInt(parts[i + 1]) ];
    best_ever_scores.push(record);
  }

  update_score_table(best_ever_scores, document.getElementById("score-ever"));
}


function save_ever_scores()
{
  if (typeof(Storage) == "undefined")
    return;

  var parts = [];

  for (var i = 0; i < best_ever_scores.length; i++) {
    var record = best_ever_scores[i];
    parts.push(record[0].getTime());
    parts.push(record[1]);
  }

  localStorage.setItem("score-ever", parts.join(" "));
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

function add_score_record(scores, table, record)
{
  var insert_point;

  for (insert_point = 0; insert_point < scores.length; insert_point++) {
    if (record[1] > scores[insert_point][1])
      break;
  }

  scores.splice(insert_point, 0, record);

  if (scores.length > 5)
    scores.splice(5, scores.length - 5);

  update_score_table(scores, table);
}

function stop_timing()
{
  if (score_timeout_id != -1) {
    clearTimeout(score_timeout_id);
    score_timeout_id = -1;
  }
  current_state = STATE_EATING_WORD;
  timer_element.innerHTML = "";
  clearInterval(timer_id);
}

function score_timeout_cb()
{
  score_timeout_id = -1;

  stop_timing();

  var cpm = good_characters;
  var wpm = cpm_to_wpm(cpm);

  document.getElementById("score-cpm").innerHTML = cpm;
  document.getElementById("score-wpm").innerHTML = wpm;
  document.getElementById("score-good").innerHTML = good_words;
  document.getElementById("score-bad").innerHTML = bad_words;

  var record = [ new Date(), cpm ];

  add_score_record(best_session_scores,
                   document.getElementById("score-session"),
                   record);
  add_score_record(best_ever_scores,
                   document.getElementById("score-ever"),
                   record);
  save_ever_scores();

  score_history.push(cpm);
  if (score_history.length > SCORE_HISTORY_LENGTH)
    score_history.splice(0, Math.floor(SCORE_HISTORY_LENGTH / 4));
  update_score_graph();
}

function start_timing()
{
  current_state = STATE_TIMING_WORDS;
  good_words = 0;
  bad_words = 0;
  good_characters = 0;
  timer_start_time = new Date();

  score_timeout_id = setTimeout(score_timeout_cb, 60000);
  timer_id = setInterval(update_timer, 1000);
  update_timer();
}

function word_changed(word_input)
{
  var value = word_input.value;

  last_change_time = new Date();

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

  load_ever_scores();

  timer_element = document.getElementById("timer");
}

window.onload = initialise;
