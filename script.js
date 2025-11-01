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

document.addEventListener("DOMContentLoaded", async function (event) {

  if (!window.location.href.includes("orders")) {
    window.location.href = "orders"
  }

  if (window.location.href.includes("orders")) {
    
    //load orders from firebase
    const orders = await getDocs(collection(db, "orders"));

    //sort orders by dateOrdered descending
    const ordersArray = [];
    orders.forEach(doc => {
      if (doc.id !== "hidden") {
        ordersArray.push(doc);
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

      var orderNumberText = "";
      if (orderData.orderNumber !== "") {
        orderNumberText = `\n<p class="orderText">Order Number: ${orderData.orderNumber}</p>`;
      }
      var completedText = "";
      if (orderData.dateCompleted) {
        completedText = `\n<p class="orderText">Completed: <span style="color: var(--colSuccess);">${orderData.dateCompleted.toDate().toLocaleDateString("en-US", options)}</span></p>`;
      }
        
      orderDiv.innerHTML = `
        <p class="orderTitle">Order for ${orderData.customerName}</p> ${completedText} ${orderNumberText}
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
  
})

// -- ////////////////////////////////////////////////////////////////////////// -- //
// -- SELECT PAGE BUTTONS ///////////////////////////////////////////////////// -- //
// -- //////////////////////////////////////////////////////////////////////// -- //

document.querySelectorAll(".sectionButton").forEach((button) => {
  button.addEventListener("click", async function () {
    if (button.getAttribute("page").startsWith("function:")) {
      if (button.getAttribute("page") === "function:NewOrder") {
        await NewOrder();
      } else if (button.getAttribute("page") === "function:BackOrder") {
        await BackOrder();
      } else if (button.getAttribute("page") === "function:SubmitNewOrder") {
        await SubmitNewOrder();
      } else if (button.getAttribute("page") === "function:UpdateOrder") {
        await UpdateOrder(document.getElementById("ordersVIEWORDER").getAttribute("orderID"));
      } else if (button.getAttribute("page") === "function:DeleteOrder") {
        await DeleteOrder(document.getElementById("ordersVIEWORDER").getAttribute("orderID"));
      } else if (button.getAttribute("page") === "function:CompleteOrder") {
        await CompleteOrder(document.getElementById("ordersVIEWORDER").getAttribute("orderID"));
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
  if (changingPages) return;
  changingPages = true;

  // Open loading screen
  await openLoading();

  document.querySelector("#ordersDEFAULT").style.display = "flex";
  document.querySelector("#ordersNEWORDER").style.display = "none";
  document.querySelector("#ordersVIEWORDER").style.display = "none";

  // Close loading screen
  await closeLoading();

  changingPages = false;
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
  const paid = document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-paid").querySelector("input").checked;
  const dateOrdered = document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-dateOrdered").value;
  await addDoc(collection(db, "orders") , {
    orderNumber: orderNumber,
    customerName: customerName,
    products: products,
    samples: samples,
    paid: paid,
    dateOrdered: Timestamp.fromDate(new Date(dateOrdered)),
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
  document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-paid").querySelector("input").checked = orderData.paid;
  document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateOrdered").value = orderData.dateOrdered.toDate().toISOString().split('T')[0];

  document.querySelector("#ordersVIEWORDER").setAttribute("orderID", orderID);

  if (orderData.dateCompleted) {
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateCompleted").value = orderData.dateCompleted.toDate().toISOString().split('T')[0];
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateCompleted").style.display = "block";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateCompletedTitle").style.display = "block";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-vieOrder-UPDATEBUTTON").style.display = "none";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-vieOrder-DELETEBUTTON").style.display = "none";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-vieOrder-COMPLETEBUTTON").style.display = "none";

    document.getElementById("orders-viewOrder-orderNumber").disabled = true;
    document.getElementById("orders-viewOrder-customerName").disabled = true;
    document.getElementById("orders-viewOrder-products").disabled = true;
    document.getElementById("orders-viewOrder-samples").disabled = true;
    document.getElementById("orders-viewOrder-paid").querySelector("input").disabled = true;
    document.getElementById("orders-viewOrder-dateOrdered").disabled = true;
  } else {
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateCompleted").value = "";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateCompleted").style.display = "none";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateCompletedTitle").style.display = "none";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-vieOrder-UPDATEBUTTON").style.display = "block";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-vieOrder-DELETEBUTTON").style.display = "block";
    document.querySelector("#ordersVIEWORDER").querySelector("#orders-vieOrder-COMPLETEBUTTON").style.display = "block";

    document.getElementById("orders-viewOrder-orderNumber").disabled = false;
    document.getElementById("orders-viewOrder-customerName").disabled = false;
    document.getElementById("orders-viewOrder-products").disabled = false;
    document.getElementById("orders-viewOrder-samples").disabled = false;
    document.getElementById("orders-viewOrder-paid").querySelector("input").disabled = false;
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
  const paid = document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-paid").querySelector("input").checked;
  const dateOrdered = document.querySelector("#ordersVIEWORDER").querySelector("#orders-viewOrder-dateOrdered").value;
  await updateDoc(doc(db, "orders", orderID) , {
    orderNumber: orderNumber,
    customerName: customerName,
    products: products,
    samples: samples,
    paid: paid,
    dateOrdered: Timestamp.fromDate(new Date(dateOrdered)),
  })
  
  await wait(pagesLoadingTime);
  window.location.reload();
}

async function DeleteOrder(orderID) {
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

async function CompleteOrder(orderID) {
  if (changingPages) return;
  changingPages = true;

  // Open loading screen
  await openLoading();


  //upload to firebase
  await updateDoc(doc(db, "orders", orderID) , {
    dateCompleted: Timestamp.fromDate(new Date())
  })
  
  await wait(pagesLoadingTime);
  window.location.reload();
}
