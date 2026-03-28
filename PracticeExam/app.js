let q;

let flags = {
  EN: "en.png",
  ES: "eo.svg",
  FR: "fr.png",
  SP: "es.png"
};

let languages = [
  ["EN", "English"],
  ["ES", "Esperanto"],
  ["FR", "French"],
  ["SP", "Spanish"]
];

document.addEventListener("DOMContentLoaded", function () {
  getQuote();
  showLanguages();
  getBackground();

  document.getElementById("infoBtn").onclick = showInfo;
  document.getElementById("transBtn").onclick = translateQuote;
  document.getElementById("quotesBtn").onclick = getQuotes;
});

function getQuote() {
  fetch("https://csumb.space/api/famousQuotes/getRandomQuote.php")
    .then(response => response.json())
    .then(data => {
      q = data;
      document.getElementById("quote").innerHTML = `"${q.quoteText}"`;
      document.getElementById("author").innerHTML = `- ${q.firstName} ${q.lastName}`;
      document.getElementById("info").innerHTML = "";
      document.getElementById("trans").innerHTML = "";
    });
}

function showLanguages() {
  languages.sort(() => Math.random() - 0.5);

  let output = "";
  for (let i = 0; i < languages.length; i++) {
    output += `<label><input type="radio" name="lang" value="${languages[i][0]}"> ${languages[i][1]}</label>`;
  }

  document.getElementById("langs").innerHTML = output;
}

function showInfo() {
  if (!q) {
    document.getElementById("info").innerHTML = '<span class="e">Quote not loaded yet</span>';
    return;
  }

  let pic = q.picture ? q.picture.replace("http://", "https://") : "";
  document.getElementById("info").innerHTML =
    `<div>
      <img src="${pic}" width="200" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <p style="display:none">Image not available</p>
    </div>
    <div><h3>${q.firstName} ${q.lastName}</h3><p>${q.bio}</p></div>`;
}

function translateQuote() {
  let lang = document.querySelector('input[name="lang"]:checked');

  if (!q) {
    document.getElementById("trans").innerHTML = '<span class="e">Quote not loaded yet</span>';
    return;
  }

  if (!lang) {
    document.getElementById("trans").innerHTML = '<span class="e">Pick a language</span>';
    return;
  }

  fetch(`https://csumb.space/api/famousQuotes/translateQuote.php?lang=${lang.value}&quoteId=${q.quoteId}`)
    .then(response => response.json())
    .then(data => {
      document.getElementById("trans").innerHTML =
        `<img src="${flags[lang.value]}" width="35"> ${data.translation}`;
    })
    .catch(() => {
      document.getElementById("trans").innerHTML = '<span class="e">Translation error</span>';
    });
}

function getQuotes() {
  let n = document.getElementById("num").value;

  if (n < 1 || n > 5 || n == "") {
    document.getElementById("quotes").innerHTML = '<span class="e">Enter 1 to 5</span>';
    return;
  }

  fetch(`https://csumb.space/api/famousQuotes/getQuotes.php?n=${n}`)
    .then(response => response.json())
    .then(data => {
      let output = "";

      for (let i = 0; i < data.length; i++) {
        output += `<p>"${data[i].quoteText}" - ${data[i].firstName} ${data[i].lastName}</p>`;
      }

      document.getElementById("quotes").innerHTML = output;
    });
}

function getBackground() {
  fetch("https://pixabay.com/api/?key=5589438-47a0bca778bf23fc2e8c5bf3e&per_page=50&orientation=horizontal&q=flowers")
    .then(response => response.json())
    .then(data => {
      let i = Math.floor(Math.random() * data.hits.length);
      document.body.style.backgroundImage = `url(${data.hits[i].largeImageURL})`;
    })
    .catch(() => {
      document.body.style.backgroundColor = "#f5f5f5";
    });
}
