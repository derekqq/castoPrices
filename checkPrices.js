function getPricesNew() {
  const getProductSku = function () {
    const prodUrlId = window.location.href.split("/").pop();
    return prodUrlId.split("_")[0];
  };

  var psid = getProductSku();
  const prodName = $("#product-title").html().trim();

  chrome.runtime.sendMessage(
    {
      name: "getAvail",
      ean: psid,
      prodName: prodName,
    },
    function (response) {
      if (response && response.stores) {
        const prices = response.stores.map(
          (store) => `<b>${store.price}</b> ${store.store} - ${store.qty} sztuk`
        );
        getPricesCont(prices, prodName);
      } else {
        z;
        getPricesCont(["Brak danych o cenie"], prodName);
      }
    }
  );

  function getStoresAndPrices(message, sender, sendResponse) {
    if (message.name === "getAvailResponse") {
      chrome.runtime.onMessage.removeListener(getStoresAndPrices);
      getPricesCont(message.prices, prodName);
    }
  }

  chrome.runtime.onMessage.addListener(getStoresAndPrices);
}

function getPricesCont(prices, prodName) {
  var pricesOrdered = prices.sort();
  // Znajdź element docelowy
  var container = document.querySelector('[data-test-id="containerType"]');
  if (!container) {
    alert("Nie znaleziono miejsca na wstawienie wyników!");
    return;
  }

  // Usuń istniejący modal jeśli jest
  document.getElementById("casto-prices-modal")?.remove();

  // Stwórz modal
  const modal = document.createElement("div");
  modal.id = "casto-prices-modal";
  modal.style = `
      position: fixed; top: 10%; left: 50%; transform: translateX(-50%);
      background: #fff; border: 2px solid #007bff; border-radius: 8px; z-index: 9999;
      box-shadow: 0 4px 24px rgba(0,0,0,0.2); padding: 24px; min-width: 340px;
    `;

  // Przygotuj tabelę z wynikami
  let tableRows = pricesOrdered
    .map((p) => {
      // Rozbij na części: cena, sklep, ilość
      const match = p.match(/<b>(.*?)<\/b>\s+(.*?)\s+-\s+(\d+) sztuk/);
      if (match) {
        return `<tr><td style="font-weight:bold;">${match[1]}</td><td>${match[2]}</td><td>${match[3]}</td></tr>`;
      } else {
        return `<tr><td colspan="3">${p}</td></tr>`;
      }
    })
    .join("");

  modal.innerHTML = `
    <button id="closeCastoPricesModal" style="margin-top:10px;padding:6px 16px;">Zamknij</button>
      <h2 style="margin-top:0;">Ceny produktu: ${prodName}</h2>
      <table style="width:100%;font-family:monospace;font-size:1.1em;margin-bottom:16px;border-collapse:collapse;">
        <thead><tr><th>Cena</th><th>Sklep</th><th>Ilość</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;

  // Wstaw modal do kontenera
  container.appendChild(modal);

  document.getElementById("closeCastoPricesModal").onclick = () =>
    modal.remove();
}

getPricesNew();
