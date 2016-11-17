var span_list = [];
var word_list = [];
var next_word = 0;
var end_word_re = /[^ ] /;
var word_ok = true;

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

function word_changed(word_input)
{
  var value = word_input.value;

  if (end_word_re.test(value)) {
    value = value.substring(0, value.length - 1);

    var result = value == word_list[next_word] ? "good" : "bad";
    span_list[next_word].className = result;

    next_word++;
    span_list[next_word].className = "next";

    word_input.value = "";
    word_ok = true;
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
