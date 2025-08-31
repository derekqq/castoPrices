const msg = document.getElementById("message");
const desc = document.getElementById("desc");

let cleanClick = false;
let currentProgressCollection;

chrome.storage.local.get(["currentProgressCollection"], (item) => {
  currentProgressCollection = item.currentProgressCollection || [];
});

function getCurrentTab(callback) {
  let queryOptions = { active: true, lastFocusedWindow: true };
  chrome.tabs.query(queryOptions, ([tab]) => {
    if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    callback(tab);
  });
}

function displayValidMsg(extraScript) {
  getCurrentTab((tab) => {
    if (!tab || !tab.url || tab.url.indexOf("www.castorama.pl") === -1) {
      msg.innerHTML =
        'Przejdź&nbsp;na <a target="_blank" href="https://www.castorama.pl">www.castorama.pl</a>';
    } else {
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          files: ["jquery-3.6.0.slim.js"],
        })
        .then(() => {
          chrome.scripting
            .executeScript({
              target: { tabId: tab.id },
              files: ["testProductPage.js"],
            })
            .then((data) => {
              if (data?.[0]?.result) {
                msg.innerHTML = "Proszę&nbsp;czekaj...";
                if (extraScript) {
                  chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: [extraScript],
                  });
                }
              } else {
                // Dodaj przycisk do sprawdzania cen dla listy
                msg.innerHTML =
                  '<button id="checkListPricesBtn" style="margin-bottom:10px;">Sprawdź ceny dla listy</button><br>Przejdź&nbsp;na stronę&nbsp;produktu!';
                // Obsługa kliknięcia przycisku
                setTimeout(() => {
                  const btn = document.getElementById("checkListPricesBtn");
                  if (btn) {
                    btn.addEventListener("click", () => {
                      msg.innerHTML =
                        '<div style="margin-bottom:10px;"><span class="loader" style="display:inline-block;width:20px;height:20px;border:3px solid #007bff;border-radius:50%;border-top:3px solid #fff;animation:spin 1s linear infinite;"></span> Sprawdzam ceny dla listy produktów...</div>';
                      // Dodaj styl animacji loadera
                      const style = document.createElement("style");
                      style.innerHTML =
                        "@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }";
                      document.head.appendChild(style);
                      chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ["checkListPrices.js"],
                      });
                    });
                  }
                }, 100);
              }
            });
        });
    }
  });
}

function clearItems() {
  cleanClick = true;
  currentProgressCollection = [];
  chrome.storage.local.set({ currentProgressCollection });
}

setInterval(() => {
  chrome.storage.local.get(["currentProgressCollection"], (item) => {
    currentProgressCollection = item.currentProgressCollection || [];

    if (currentProgressCollection.length === 0) {
      desc.innerHTML = "";

      if (cleanClick) {
        msg.innerHTML = "...";
      } else {
        displayValidMsg();
      }

      return;
    }

    cleanClick = false;
    const descHTML = [];

    currentProgressCollection.forEach((item) => {
      descHTML.push(
        `&#10140; ${item.name} - <b>${item.ready}/${item.all}</b>`.replace(
          /\s/g,
          "&nbsp;"
        )
      );
    });

    descHTML.push(
      `<br/><a href="#" id="cleanAll" style="font-size: 0.8em">wyczyść</a> <i style="font-size: 0.7em">(w razie gdy proces się zatrzyma)</i>`
    );

    // Dodaj przycisk skanowania listy produktów u góry
    msg.innerHTML =
      '<button id="checkListPricesBtn" style="margin-bottom:10px;">Skanuj całą listę</button><br>Proszę&nbsp;czekaj...';
    desc.innerHTML = descHTML.join("<br/>");

    setTimeout(() => {
      const btn = document.getElementById("checkListPricesBtn");
      if (btn) {
        btn.addEventListener("click", () => {
          msg.innerHTML =
            '<div style="margin-bottom:10px;"><span class="loader" style="display:inline-block;width:20px;height:20px;border:3px solid #007bff;border-radius:50%;border-top:3px solid #fff;animation:spin 1s linear infinite;"></span> Skanuję całą listę produktów...</div>';
          // Dodaj styl animacji loadera
          const style = document.createElement("style");
          style.innerHTML =
            "@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }";
          document.head.appendChild(style);
          getCurrentTab((tab) => {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["checkListPrices.js"],
            });
          });
        });
      }
    }, 100);

    const cleanAllLink = document.getElementById("cleanAll");
    cleanAllLink.addEventListener("click", () => clearItems());
  });
}, 500);

getCurrentTab((tab) => {
  if (!tab.url || tab.url.indexOf("www.castorama.pl") === -1) {
    msg.innerHTML =
      'Przejdź&nbsp;na <a target="_blank" href="https://www.castorama.pl">www.castorama.pl</a>';
    return;
  }

  chrome.scripting
    .executeScript({
      target: { tabId: tab.id },
      files: ["jquery-3.6.0.slim.js"],
    })
    .then(() => {
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          files: ["getProdName.js"],
        })
        .then((prodNameRes) => {
          const prodName = prodNameRes?.[0].result;

          if (
            !prodName ||
            currentProgressCollection.some((item) => item.name === prodName)
          ) {
            return;
          }

          displayValidMsg("checkPrices.js");
        });
    });
});
