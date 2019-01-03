// An Item Class
class Item {
  constructor(name, rating, selected = false) {
    this.name = name;
    this.rating = rating;
    this.selected = selected;
  }
}

class Controller {
  // Returns the index of the array with more probability
  static randomWeightedChoice(
    table,
    temperature = 50, // in [0,100], 50 is neutral
    randomFunction = Math.random,
    influence = 2 // seems fine, hard to tune
  ) {
    const T = (temperature - 50) / 50;
    const nb = table.length;
    if (!nb) {
      return null;
    }

    const total = table.reduce(
      (previousTotal, element) => previousTotal + element.weight,
      0
    );

    const avg = total / nb;

    // Compute amplified urgencies (depending on temperature)
    const ur = {};
    const urgencySum = table.reduce((previousSum, element) => {
      const { id, weight } = element;
      let urgency = weight + T * influence * (avg - weight);
      if (urgency < 0) urgency = 0;
      ur[id] = (ur[id] || 0) + urgency;
      return previousSum + urgency;
    }, 0);

    let currentUrgency = 0;
    const cumulatedUrgencies = {};
    Object.keys(ur).forEach(id => {
      currentUrgency += ur[id];
      cumulatedUrgencies[id] = currentUrgency;
    });

    if (urgencySum < 1) return null; // No weight given
    // Choose
    const choice = randomFunction() * urgencySum;
    const ids = Object.keys(cumulatedUrgencies);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const urgency = cumulatedUrgencies[id];
      if (choice <= urgency) {
        return id;
      }
    }
  }
}

// UI Class: Handle UI Tasks
class UI {
  // UI creates List
  static displayItems() {
    const items = LocalStore.getItems();

    items.forEach(item => UI.addItemToList(item));
  }

  // Selects an item from list
  static async choseItem() {
    // Gets Items
    const items = await LocalStore.getItems();
    // Transform data to be tretaed
    const normalized = items.map(({ rating, name }) => {
      return { weight: rating, id: name };
    });
    console.log('Items Normalized to treat: ',normalized);

    // Item that will be selected
    let itemSelectedRandomly;

    /**
     * @function RandomSelection
     * If it has no weights it uses a simple random
     * Else, it delivers it to a balanced random function
     */
    if (normalized.reduce((acum, current) => acum + current.weight, 0) === 0)
    {
      console.log('Normal Random performed');
      itemSelectedRandomly = Math.floor(Math.random() * items.length); 
    }
    else
    {
      console.log('Balanced Random performed'); 
      itemSelectedRandomly = await Controller.randomWeightedChoice(normalized);
    }
     

    console.log('Item Selected: ', items.find(({ name }) => name === itemSelectedRandomly));
    let  itemListIndex =  items.findIndex((item) => item.name === itemSelectedRandomly);
    document.getElementById('item-list').rows[itemListIndex].classList.add("table-info");
  }

  // Resets everything
  static reset() {
    const tb = document.getElementById("item-list");
    while (tb.hasChildNodes()) {
      tb.removeChild(tb.lastChild);
    }
    const items = [];

    localStorage.setItem("items", JSON.stringify(items));
  }

  static addItemToList({ name, rating = "none", selected = "" }) {
    const list = document.querySelector("#item-list");

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${name}</td>
        <td>${rating}</td>
        <td><button class="btn btn-danger btn-sm delete">Remove</button></td>
      `;

    list.appendChild(row);
  }

  static deleteitem(el) {
    if (el.classList.contains("delete")) {
      el.parentElement.parentElement.remove();
    }
  }

  static showAlert(message, className) {
    const div = document.createElement("div");
    div.className = `alert alert-${className}`;
    div.appendChild(document.createTextNode(message));
    const container = document.querySelector(".container");
    const form = document.querySelector("#item-form");
    container.insertBefore(div, form);

    // Vanish in 3 seconds
    setTimeout(() => document.querySelector(".alert").remove(), 3000);
  }

  static clearFields() {
    document.querySelector("#name").value = "";
    document.querySelector("#rating").value = "";
  }
}

// Store Class: Handles Storage
class LocalStore {
  static getItems() {
    let items;
    if (localStorage.getItem("items") === null) {
      items = [];
    } else {
      items = JSON.parse(localStorage.getItem("items"));
    }

    return items;
  }

  static addItem(item) {
    const items = LocalStore.getItems();
    items.push(item);
    localStorage.setItem("items", JSON.stringify(items));
  }

  static removeItem(name) {
    const items = LocalStore.getItems();

    items.forEach((item, index) => {
      if (item.name === name) {
        items.splice(index, 1);
      }
    });

    localStorage.setItem("items", JSON.stringify(items));
  }
}

// Event: Display  when document loads
document.addEventListener("DOMContentLoaded", UI.displayItems);
window.onload = function() {
  // Event: Add a item
  if (document.getElementById("item-form"))
    document.querySelector("#item-form").addEventListener("submit", e => {
      // Prevent actual submit
      e.preventDefault();

      // Get form values
      const name = document.querySelector("#name").value;
      const rating = Number(document.querySelector("#rating").value);

      console.log("Submited", name);

      // Validate
      if (name === "" || rating === "") {
        UI.showAlert("Please give the item a name and a rating", "danger");
      } else {
        // Instatiate item
        const item = new Item(name, rating);

        // Add item to UI
        UI.addItemToList(item);

        // Add item to store
        try {
          LocalStore.addItem(item);
        } catch {
          UI.showAlert("Error adding item!", "danger");
        }

        // Show success message
        UI.showAlert("Item Added", "success");

        // Clear fields
        UI.clearFields();
      }
    });

  if (document.getElementById("item-list"))
    // Event: Remove a item
    document.querySelector("#item-list").addEventListener("click", e => {
      // Remove item from UI
      UI.deleteitem(e.target);

      // Remove item from store
      LocalStore.removeItem(
        e.target.parentElement.previousElementSibling.previousElementSibling
          .textContent
      );

      // Show success message
      UI.showAlert("item Removed", "success");
    });
};
