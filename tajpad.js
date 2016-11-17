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

function fill_words()
{
  var i;
  var words = [];

  for (i = 0; i < 1000; i++)
    words.push(get_word());

  var p = document.getElementById("word-list");
  p.appendChild(document.createTextNode(words.join(" ")));
}

window.onload = fill_words;
