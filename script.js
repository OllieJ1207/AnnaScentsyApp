// -- ////////////////////////////////////////////////////////////////////////// -- //
// -- IMPORTS ///////////////////////////////////////////////////////////////// -- //
// -- //////////////////////////////////////////////////////////////////////// -- //

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  deleteField,
  Timestamp,
  increment,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// -- ////////////////////////////////////////////////////////////////////////// -- //
// -- FIREBASE //////////////////////////////////////////////////////////////// -- //
// -- //////////////////////////////////////////////////////////////////////// -- //

const firebaseConfig = {
  apiKey: "AIzaSyDG1jzdifkQS1lxHuVnqNrGzElyKDyehW0",
  authDomain: "mumscentsyapp.firebaseapp.com",
  projectId: "mumscentsyapp",
  storageBucket: "mumscentsyapp.firebasestorage.app",
  messagingSenderId: "402355310595",
  appId: "1:402355310595:web:9ffb3c4b43a929a2093e36",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// -- ////////////////////////////////////////////////////////////////////////// -- //
// -- EVENTS AND TIMESTAMPS /////////////////////////////////////////////////// -- //
// -- //////////////////////////////////////////////////////////////////////// -- //

const options = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

// -- ////////////////////////////////////////////////////////////////////////// -- //
// -- OTHER VARS ////////////////////////////////////////////////////////////// -- //
// -- //////////////////////////////////////////////////////////////////////// -- //

const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
var changingPages = false;
var pagesLoadingTime = 600;
var isSearchingOrders = false;
var hasHadEdits = false;

// -- ////////////////////////////////////////////////////////////////////////// -- //
// -- FUNCTIONS /////////////////////////////////////////////////////////////// -- //
// -- //////////////////////////////////////////////////////////////////////// -- //

function getDeviceByScreen() {
  const width = window.innerWidth;

  if (width <= 768) return "Mobile";
  if (width <= 1024) return "Tablet";
  return "Desktop";
}

async function openLoading() {
  document.querySelector(".V1GLOBAL_LoadingDiv").style.width = "100vw";
  await wait(600);
  return;
}

async function closeLoading() {
  document.querySelector(".V1GLOBAL_LoadingDiv").querySelector("img").classList.add("V1GLOBAL_LoadingDivAnimation")
  await wait(600);
  document.querySelector(".V1GLOBAL_LoadingDiv").querySelector("img").classList.remove("V1GLOBAL_LoadingDivAnimation")
  document.querySelector(".V1GLOBAL_LoadingDiv").style.width = "0vw";
  await wait(600);
  return;
}

// -- ////////////////////////////////////////////////////////////////////////// -- //
// -- LOCK ORIENTATION //////////////////////////////////////////////////////// -- //
// -- //////////////////////////////////////////////////////////////////////// -- //

document.documentElement.requestFullscreen().then(() => {
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("portrait").catch(function (error) {
      console.warn("Orientation lock failed:", error);
    });
  }
});

// -- ////////////////////////////////////////////////////////////////////////// -- //
// -- ON PAGE LOAD //////////////////////////////////////////////////////////// -- //
// -- //////////////////////////////////////////////////////////////////////// -- //

if (window.location.href.includes("orders")) {

  document.getElementById("orders-viewOrder-orderNumber").onchange = function () {
    hasHadEdits = true;
  }
  document.getElementById("orders-viewOrder-customerName").onchange = function () {
    hasHadEdits = true;
  }
  document.getElementById("orders-viewOrder-products").onchange = function () {
    hasHadEdits = true;
  }
  document.getElementById("orders-viewOrder-samples").onchange = function () {
    hasHadEdits = true;
  }
  document.getElementById("orders-viewOrder-total").onchange = function () {
    hasHadEdits = true;
  }
  document.getElementById("orders-viewOrder-paid").onchange = function () {
    hasHadEdits = true;
  }
  document.getElementById("orders-viewOrder-deliveryReady").onchange = function () {
    hasHadEdits = true;
  }
  document.getElementById("orders-viewOrder-dateOrdered").onchange = function () {
    hasHadEdits = true;
  }

}

document.addEventListener("DOMContentLoaded", async function (event) {

  if (!window.location.href.includes("orders")) {
    window.location.href = "orders"
  }

  if (window.location.href.includes("orders")) {

    if (window.location.href.includes("viewAllOrders=true")) {
     document.getElementById("orders-defaultOrder-VIEWALLORDERSBUTTON").innerHTML = "View Recent Orders"
    } else {
      document.getElementById("orders-defaultOrder-VIEWALLORDERSBUTTON").innerHTML = "View All Orders"
    }
    
    //load orders from firebase
    const orders = await getDocs(collection(db, "orders"));

    const LoadAll = new URLSearchParams(window.location.search).get("viewAllOrders") === "true"

    //sort orders by dateOrdered descending
    const ordersArray = [];
    await orders.forEach(doc => {
      if (doc.id !== "hidden") {
        
        //add order to array if it was ordered in the last 30 days
        if (doc.data().dateOrdered.toDate() > new Date(new Date().setDate(new Date().getDate() - 60))) {
          ordersArray.push(doc);
          
        } else if (LoadAll == true) {

          //add order to array if it was ordered in the last 6 months
          if (doc.data().dateOrdered.toDate() > new Date(new Date().setMonth(new Date().getMonth() - 6))) {
            ordersArray.push(doc);
          }
          
        }
      }
    });

    // Sort by dateOrdered descending
    ordersArray.sort((a, b) => b.data().dateOrdered.toMillis() - a.data().dateOrdered.toMillis());
    
    //clear orders
    document.querySelector("#ordersDEFAULT").querySelectorAll(".ID_orderSection").forEach(item => item.remove())

    //add orders to page
    ordersArray.forEach((order) => {
      if (order.id === "hidden") { return; }
      const orderData = order.data()
      //add order to page
      const orderDiv = document.createElement("div");
      const paid = orderData.paid ? "<span style='color: var(--colSuccess);'>Yes</span>" : "<span style='color: var(--colError);'>No</span>";
      orderDiv.classList.add("section");
      orderDiv.classList.add("ID_orderSection");
      orderDiv.setAttribute("orderID", order.id)

      var deliveryText = "";
      // if (orderData.delivery == true) {
      //     deliveryText = `\n<p class="orderText" style="color: var(--colSuccess);">Order Delivered!</p>`;
      // }
      var orderNumberText = "";
      if (orderData.orderNumber !== "") {
        orderNumberText = `\n<p class="orderText">Order Number: ${orderData.orderNumber}</p>`;
      }
      var completedText = "";
      if (orderData.dateCompleted) {
        completedText = `\n<p class="orderText">Completed: <span style="color: var(--colSuccess);">${orderData.dateCompleted.toDate().toLocaleDateString("en-US", options)}</span></p>`;
      }
        
      orderDiv.innerHTML = `
        <p class="orderTitle">Order for ${orderData.customerName}</p> ${deliveryText} ${completedText} ${orderNumberText}
        <p class="orderText">Paid: ${paid}</p>
        <p class="orderText">Date: ${orderData.dateOrdered.toDate().toLocaleDateString("en-US", options)}</p>
        <button class="sectionPillButton sectionTitle" page="function:ViewOrder">View Order</button>
      `
        
      orderDiv.querySelector("button").addEventListener("click", async function () {
        await ViewOrder(order.id);
      })
      document.querySelector("#ordersDEFAULT").appendChild(orderDiv);
    })
  }
  
  await wait(pagesLoadingTime);

  // Close loading screen
  await closeLoading();
  
});

// -- ////////////////////////////////////////////////////////////////////////// -- //
// -- SELECT PAGE BUTTONS ///////////////////////////////////////////////////// -- //
// -- //////////////////////////////////////////////////////////////////////// -- //

document.querySelectorAll(".sectionButton").forEach((button) => {
  button.addEventListener("click", async function () {
    if (button.getAttribute("page").startsWith("function:")) {

      if (AllFunctions[button.getAttribute("page").replace("function:", "")]) {

        if ([ "UpdateOrder", "DeleteOrder", "CompleteOrder" ].includes(button.getAttribute("page").replace("function:", ""))) {
          await AllFunctions[button.getAttribute("page").replace("function:", "")](button.parentElement.parentElement.getAttribute("orderID"));
        } else {
          await AllFunctions[button.getAttribute("page").replace("function:", "")]();
        }
        
      } else {
        console.error("Function not found: " + button.getAttribute("page").replace("function:", ""));
      }
      
    } else {
      if (changingPages) return;
      changingPages = true;

      // Open loading screen
      await openLoading();
      
      window.location.href = button.getAttribute("page");
    }
  });
});

async function NewOrder() {
  if (changingPages) return;
  changingPages = true;

  // Open loading screen
  await openLoading();

  document.querySelector("#ordersDEFAULT").style.display = "none";
  document.querySelector("#ordersNEWORDER").style.display = "flex";
  document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-orderNumber").value = "";
  document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-customerName").value = "";
  document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-products").value = "";
  document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-paid").querySelector("input").checked = false;
  const today = new Date().toISOString().split('T')[0];
  document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-dateOrdered").value = today;

  // Close loading screen
  await closeLoading();

  changingPages = false;
}

async function BackOrder() {
  if (hasHadEdits == true) {
    document.getElementById("orders-savePopup").style.display = "block";
    document.getElementById("ordersDEFAULT").style.position = "relative";
    document.getElementById("ordersNEWORDER").style.position = "relative";
    document.getElementById("ordersVIEWORDER").style.position = "relative";
  } else {
  
    if (changingPages) return;
    changingPages = true;
  
    // Open loading screen
    await openLoading();
  
    document.querySelector("#ordersDEFAULT").style.display = "flex";
    document.querySelector("#ordersNEWORDER").style.display = "none";
    document.querySelector("#ordersVIEWORDER").style.display = "none";
    document.getElementById("orders-viewOrder-DELETEBUTTON").innerHTML = "Delete Order"
    document.getElementById("orders-viewOrder-DELETEBUTTON").style.borderColor = "var(--colDark)"
    document.getElementById("orders-savePopup").style.display = "none";
    document.getElementById("ordersDEFAULT").style.removeProperty("position");
    document.getElementById("ordersNEWORDER").style.removeProperty("position");
    document.getElementById("ordersVIEWORDER").style.removeProperty("position");
  
    // Close loading screen
    await closeLoading();
  
    changingPages = false;

  }
}

async function BackOrderSave() {
  hasHadEdits = false;
  await BackOrder();
}

async function ExitCancel() {
  document.getElementById("orders-savePopup").style.display = "none";
  document.getElementById("ordersDEFAULT").style.removeProperty("position");
  document.getElementById("ordersNEWORDER").style.removeProperty("position");
  document.getElementById("ordersVIEWORDER").style.removeProperty("position");
}

async function SubmitNewOrder() {
  if (changingPages) return;
  changingPages = true;

  // Open loading screen
  await openLoading();

  document.querySelector("#ordersDEFAULT").style.display = "flex";
  document.querySelector("#ordersNEWORDER").style.display = "none";
  
  //upload to firebase
  const orderNumber = document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-orderNumber").value;
  const customerName = document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-customerName").value;
  const products = document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-products").value;
  const samples = document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-samples").value;
  const total = document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-total").value;
  const paid = document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-paid").querySelector("input").checked;
  const delivery = document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-deliveryReady").querySelector("input").checked;
  const dateOrdered = document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-dateOrdered").value;
  await addDoc(collection(db, "orders") , {
    orderNumber: orderNumber,
    customerName: customerName,
    products: products,
    samples: samples,
    total: total,
    paid: paid,
    delivery: delivery,
    dateOrdered: Timestamp.fromDate(new Date(dateOrdered)),
    DEV_dateCreated: Timestamp.fromDate(new Date())
  })

  await wait(pagesLoadingTime);
  window.location.reload();
}

async function ViewOrder(orderID) {
  if (changingPages) return;
  changingPages = true;

  // Open loading screen
  await openLoading();

  document.querySelector("#ordersDEFAULT").style.display = "none";
  document.querySelector("#ordersVIEWORDER").style.display = "flex";

  //load order from firebase
  const order = await getDoc(doc(db, "orders", orderID));
  const orderData = order.data();
  
  //set order data
  document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-orderNumber").value = orderData.orderNumber;
  document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-customerName").value = orderData.customerName;
  document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-products").value = orderData.products;
  document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-samples").value = orderData.samples;
  document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-total").value = orderData.total;
  document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-paid").querySelector("input").checked = orderData.paid;
  document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-deliveryReady").querySelector("input").checked = orderData.delivery;
  document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateOrdered").value = orderData.dateOrdered.toDate().toISOString().split('T')[0];

  document.querySelector("#ordersVIEWORDER").setAttribute("orderID", orderID);

  if (orderData.dateCompleted) {
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateCompleted").value = orderData.dateCompleted.toDate().toISOString().split('T')[0];
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateCompleted").style.display = "block";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateCompletedTitle").style.display = "block";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-UPDATEBUTTON").style.display = "none";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-DELETEBUTTON").style.display = "none";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-COMPLETEBUTTON").innerHTML = "Uncomplete Order";

    document.getElementById("orders-viewOrder-orderNumber").disabled = true;
    document.getElementById("orders-viewOrder-customerName").disabled = true;
    document.getElementById("orders-viewOrder-products").disabled = true;
    document.getElementById("orders-viewOrder-samples").disabled = true;
    document.getElementById("orders-viewOrder-total").disabled = true;
    document.getElementById("orders-viewOrder-paid").querySelector("input").disabled = true;
    document.getElementById("orders-viewOrder-deliveryReady").querySelector("input").disabled = true;
    document.getElementById("orders-viewOrder-dateOrdered").disabled = true;
  } else {
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateCompleted").value = "";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateCompleted").style.display = "none";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateCompletedTitle").style.display = "none";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-UPDATEBUTTON").style.display = "block";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-DELETEBUTTON").style.display = "block";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-COMPLETEBUTTON").innerHTML = "Complete Order";

    document.getElementById("orders-viewOrder-orderNumber").disabled = false;
    document.getElementById("orders-viewOrder-customerName").disabled = false;
    document.getElementById("orders-viewOrder-products").disabled = false;
    document.getElementById("orders-viewOrder-samples").disabled = false;
    document.getElementById("orders-viewOrder-total").disabled = false;
    document.getElementById("orders-viewOrder-paid").querySelector("input").disabled = false;
    document.getElementById("orders-viewOrder-deliveryReady").querySelector("input").disabled = false;
    document.getElementById("orders-viewOrder-dateOrdered").disabled = false;
  }

  // Close loading screen
  await closeLoading();

  changingPages = false;
}

async function UpdateOrder(orderID) {
  if (changingPages) return;
  changingPages = true;

  // Open loading screen
  await openLoading();

  document.querySelector("#ordersDEFAULT").style.display = "flex";
  document.querySelector("#ordersVIEWORDER").style.display = "none";

  //upload to firebase
  const orderNumber = document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-orderNumber").value;
  const customerName = document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-customerName").value;
  const products = document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-products").value;
  const samples = document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-samples").value;
  const total = document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-total").value;
  const paid = document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-paid").querySelector("input").checked;
  const delivery = document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-deliveryReady").querySelector("input").checked;
  const dateOrdered = document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateOrdered").value;
  await updateDoc(doc(db, "orders", orderID) , {
    orderNumber: orderNumber,
    customerName: customerName,
    products: products,
    samples: samples,
    total: total,
    paid: paid,
    delivery: delivery,
    dateOrdered: Timestamp.fromDate(new Date(dateOrdered)),
  })
  
  await wait(pagesLoadingTime);
  window.location.reload();
}

async function DeleteOrder(orderID) {
  if (document.getElementById("orders-viewOrder-DELETEBUTTON").innerHTML == "Delete Order") {
    document.getElementById("orders-viewOrder-DELETEBUTTON").innerHTML = "Confirm Delete";
    document.getElementById("orders-viewOrder-DELETEBUTTON").style.borderColor = "var(--colError)"
  } else {
    
    if (changingPages) return;
    changingPages = true;
  
    // Open loading screen
    await openLoading();
  
    document.querySelector("#ordersDEFAULT").style.display = "flex";
    document.querySelector("#ordersVIEWORDER").style.display = "none";
    await deleteDoc(doc(db, "orders", orderID));
    
    await wait(pagesLoadingTime);
    window.location.reload();
  
  }
}

async function CompleteOrder(orderID) {
  if (changingPages) return;
  changingPages = true;

  // Open loading screen
  await openLoading();


  //upload to firebase
  if (document.getElementById("orders-viewOrder-COMPLETEBUTTON").innerHTML == "Uncomplete Order") {
    await updateDoc(doc(db, "orders", orderID) , { 
      dateCompleted: deleteField()
    })
  } else {
    await updateDoc(doc(db, "orders", orderID) , {
      dateCompleted: Timestamp.fromDate(new Date())
    })
  }
  
  await wait(pagesLoadingTime);
  window.location.reload();
}

async function ViewAllOrders() {
  if (changingPages) return;
  changingPages = true;

  // Open loading screen
  await openLoading();

  if (window.location.href.includes("viewAllOrders=true")) {
    window.location.href = "orders";
  } else {
    window.location.href = "orders?viewAllOrders=true";
  }
}

const AllFunctions = { NewOrder, BackOrder, BackOrderSave, ExitCancel, SubmitNewOrder, ViewOrder, UpdateOrder, DeleteOrder, CompleteOrder, ViewAllOrders }

document.getElementById("orders-defaultOrder-searchBox").addEventListener("input", async function() {

  if (isSearchingOrders) return;
  isSearchingOrders = true;
  await SearchOrders();
  await wait(100);
  isSearchingOrders = false;
  
})

async function SearchOrders() {
  let input = document.getElementById('orders-defaultOrder-searchBox').value
  input = input.toLowerCase();
  let x = document.getElementsByClassName('section ID_orderSection');
  
  for (var i = 0; i < x.length; i++) {
    if (!x[i].querySelectorAll(".orderTitle")[0].innerHTML.toLowerCase().includes(input) && !x[i].querySelectorAll(".orderText")[1].innerHTML.toLowerCase().includes(input)) {
      x[i].style.display = "none";
    }
    else {
      if (x[i].style.display == "none") {
        x[i].style.removeProperty("display");
      }
    }
  }
}
