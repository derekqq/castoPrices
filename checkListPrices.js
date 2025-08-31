// Skrypt do sprawdzania najlepszej ceny na liście produktów Castorama
(function () {
  // ...pozostaw tylko processPage()...

  function processPage() {
    const items = document.querySelectorAll(
      "li[data-page-number] div[data-ean]"
    );
    let processed = 0;
    items.forEach((item) => {
      const ean = item.getAttribute("data-ean");
      if (!ean) return;

      let priceDiv = item.querySelector('[data-test-id="productPrice"]');
      if (!priceDiv) {
        priceDiv = document.createElement("div");
        priceDiv.className = "best-price-loader";
        item.appendChild(priceDiv);
      }

      // Sprawdź czy najlepsze ceny są już w localStorage
      const cached = localStorage.getItem("bestPrices_" + ean);
      if (cached) {
        const cachedArr = JSON.parse(cached);
        cachedArr.forEach((obj, idx) => {
          let discountInfo = obj.discountInfo || "";
          let specialMark = obj.specialMark || "";
          priceDiv.innerHTML += `<div style="color: green; font-weight: bold;">${
            idx + 1
          }. ${obj.price} zł (${obj.store}, ${
            obj.qty
          } szt.)${discountInfo}${specialMark} <span style="color:#888;font-size:0.9em;">(z pamięci)</span></div>`;
          if (specialMark.length > 1) {
            const panel = priceDiv.closest(
              '[data-test-id="product-panel"]'
            ).parentNode;
            panel.style.order = "-1";
          }
        });

        processed++;
        // if (processed === items.length) checkNextPage();
        return;
      }

      priceDiv.innerHTML +=
        '<div style="color: #007bff;">Sprawdzam najlepszą cenę...</div>';

      chrome.runtime.sendMessage(
        {
          name: "getAvail",
          ean: ean,
          prodName:
            item.querySelector('h3[data-test-id="productTitle"]')?.innerText ||
            "",
        },
        (response) => {
          if (!response || !response.stores) {
            priceDiv.innerHTML +=
              '<div style="color: red;">Brak danych o cenie</div>';
            processed++;
            if (processed === items.length) checkNextPage();
            return;
          }
          // Posortuj ceny rosnąco
          const sorted = response.stores
            .slice()
            .sort((a, b) => a.price - b.price);
          // Pobierz pierwotną cenę z DOM (jeśli dostępna)
          let originalPrice = null;
          const origPriceElem = item.querySelector(
            '[data-test-id="product-primary-price"] ._5d34bd7a'
          );
          if (origPriceElem) {
            const val = origPriceElem.textContent
              .replace(/[^\d.,]/g, "")
              .replace(",", ".");
            originalPrice = parseFloat(val);
          }
          // Przygotuj 3 najlepsze ceny
          const bestArr = sorted.slice(0, 3).map((obj) => {
            let discountInfo = "";
            let discount = null;
            if (originalPrice && obj.price < originalPrice) {
              discount = Math.round(
                (100 * (originalPrice - obj.price)) / originalPrice
              );
              discountInfo = ` <span style=\"color:red;font-size:0.95em;\">(${discount}% taniej)</span>`;
            }
            let specialMark = "";
            if (discount !== null && discount > 50) {
              specialMark =
                ' <span style="background:yellow;color:red;font-weight:bold;padding:2px 6px;border-radius:4px;">MEGA OKAZJA!</span>';
              const panel = priceDiv.closest(
                '[data-test-id="product-panel"]'
              ).parentNode;
              console.log("🚀 ~ processPage ~ panel:", panel);
              panel.style.order = "-1";
            }
            return {
              store: obj.store,
              price: obj.price,
              qty: obj.qty,
              discountInfo,
              specialMark,
            };
          });
          bestArr.forEach((obj, idx) => {
            priceDiv.innerHTML += `<div style=\"color: green; font-weight: bold;\">${
              idx + 1
            }. ${obj.price} zł (${obj.store}, ${obj.qty} szt.)${
              obj.discountInfo
            }${obj.specialMark}</div>`;
          });
          // Zapisz 3 najlepsze ceny do localStorage
          localStorage.setItem("bestPrices_" + ean, JSON.stringify(bestArr));
          processed++;
          if (processed === items.length) checkNextPage();
        }
      );
    });
  }

  function checkNextPage() {
    // Szukaj linku do następnej strony
    const nextLink = document.querySelector('a[rel="next"]');
    if (nextLink && nextLink.href) {
      // Przejdź do kolejnej strony po krótkim opóźnieniu
      setTimeout(() => {
        window.location.href = nextLink.href;
      }, 35000);
    }
  }

  setTimeout(() => {
    processPage();
  }, 3500);
})();
