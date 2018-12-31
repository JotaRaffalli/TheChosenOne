// An Item Class
class Item {
  constructor(name, rating, selected = false) {
    this.name = name;
    this.rating = rating;
    this.selected = selected;
  }
}

// UI Class: Handle UI Tasks
class UI {
  static displayItems() {
    const items = LocalStore.getItems();

    items.forEach(item => UI.addItemToList(item));
  }
  // Selects an item from list
  static choseItem() {
    const items =  LocalStore.getItems();
    const index = Math.floor(Math.random()*items.length);
    
    document.getElementById('item-list').rows[index].classList.add("table-info");

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
        <td>${selected}</td>
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
      const rating = document.querySelector("#rating").value;

      console.log("Submited", name);

      // Validate
      if (name === "") {
        UI.showAlert("Please give the item a name", "danger");
      } else {
        // Instatiate item
        const item = new Item(name, rating);

        // Add item to UI
        UI.addItemToList(item);

        // Add item to store
        LocalStore.addItem(item);

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
          .previousElementSibling.textContent
      );

      // Show success message
      UI.showAlert("item Removed", "success");
    });
};
