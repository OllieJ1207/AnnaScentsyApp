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
  Timestamp,
  increment,
  deleteField,
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

// -- ////////////////////////////////////////////////////////////////////////// -- //
// -- FUNCTIONS /////////////////////////////////////////////////////////////// -- //
// -- //////////////////////////////////////////////////////////////////////// -- //

function getDeviceByScreen() {
  const width = window.innerWidth;

  if (width <= 768) return "Mobile";
  if (width <= 1024) return "Tablet";
  return "Desktop";
}

async function playLoadAnim() {
  document.querySelector(".V1GLOBAL_LoadingDiv").querySelector("img").classList.add("V1GLOBAL_LoadingDivAnimation")
  await wait(1000);
  document.querySelector(".V1GLOBAL_LoadingDiv").style.width = "0vw";
  document.querySelector(".V1GLOBAL_LoadingDiv").querySelector("img").classList.remove("V1GLOBAL_LoadingDivAnimation")
  await wait(1000);
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
    //clear orders
    document.querySelector("#ordersDEFAULT").querySelectorAll(".ID_orderSection").forEach(item => item.remove())

    //add orders to page
    orders.forEach((order) => {
      if (order.id === "hidden") { return; }
      const orderData = order.data()
      //add order to page
      const orderDiv = document.createElement("div");
      const paid = orderData.paid ? "<span style='color: var(--colSuccess);'>Yes</span>" : "<span style='color: var(--colError);'>No</span>";
      orderDiv.classList.add("section");
      orderDiv.classList.add("ID_orderSection");
      orderDiv.setAttribute("orderID", order.id)
      orderDiv.innerHTML = `
        <p class="orderTitle">Order for ${orderData.customerName}</p>
        <p class="orderText">Paid: ${paid}</p>
        <p class="orderText">Date: ${orderData.dateOrdered.toDate().toLocaleDateString("en-US", options)}</p>
        <button class="sectionPillButton sectionTitle" page="function:ViewOrder">Enter New Order</button>
      `
      if (orderData.orderNumber !== "") {
        orderDiv.innerHTML = `
          <p class="orderTitle">Order for ${orderData.customerName}</p>
          <p class="orderText">Order Number: ${orderData.orderNumber}</p>
          <p class="orderText">Paid: ${paid}</p>
          <p class="orderText">Date: ${orderData.dateOrdered.toDate().toLocaleDateString("en-US", options)}</p>
        <button class="sectionPillButton sectionTitle" page="function:ViewOrder">Enter New Order</button>
        `
      }
      orderDiv.querySelector("button").addEventListener("click", async function () {
        await ViewOrder(order.id);
      })
      document.querySelector("#ordersDEFAULT").appendChild(orderDiv);
    })
  }
  
  await wait(1000);
  await playLoadAnim();
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
      }
    } else {
      if (changingPages) return;
      changingPages = true;
      document.querySelector(".V1GLOBAL_LoadingDiv").style.width = "100vw";
      await wait(1100);
      window.location.href = button.getAttribute("page");
    }
  });
});

async function NewOrder() {
  if (changingPages) return;
  changingPages = true;
  document.querySelector(".V1GLOBAL_LoadingDiv").style.width = "100vw";
  await wait(1500);
  document.querySelector("#ordersDEFAULT").style.display = "none";
  document.querySelector("#ordersNEWORDER").style.display = "flex";
  document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-orderNumber").value = "";
  document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-customerName").value = "";
  document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-products").value = "";
  document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-paid").querySelector("input").checked = false;
  const today = new Date().toISOString().split('T')[0];
  document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-dateOrdered").value = today;
  await playLoadAnim();
  changingPages = false;
}

async function BackOrder() {
  if (changingPages) return;
  changingPages = true;
  document.querySelector(".V1GLOBAL_LoadingDiv").style.width = "100vw";
  await wait(1500);
  document.querySelector("#ordersDEFAULT").style.display = "flex";
  document.querySelector("#ordersNEWORDER").style.display = "none";
  document.querySelector("#ordersVIEWORDER").style.display = "none";
  await playLoadAnim();
  changingPages = false;
}

async function SubmitNewOrder() {
  if (changingPages) return;
  changingPages = true;
  document.querySelector(".V1GLOBAL_LoadingDiv").style.width = "100vw";
  await wait(1500);
  document.querySelector("#ordersDEFAULT").style.display = "flex";
  document.querySelector("#ordersNEWORDER").style.display = "none";
  
  //upload to firebase
  const orderNumber = document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-orderNumber").value;
  const customerName = document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-customerName").value;
  const products = document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-products").value;
  const paid = document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-paid").querySelector("input").checked;
  const dateOrdered = document.querySelector("#ordersNEWORDER").querySelector("#orders-newOrder-dateOrdered").value;
  await addDoc(collection(db, "orders") , {
    orderNumber: orderNumber,
    customerName: customerName,
    products: products,
    paid: paid,
    dateOrdered: Timestamp.fromDate(new Date(dateOrdered)),
  })

  await wait(500);
  window.location.reload();
}

async function ViewOrder(orderID) {
  if (changingPages) return;
  changingPages = true;
  document.querySelector(".V1GLOBAL_LoadingDiv").style.width = "100vw";
  await wait(1500);
  document.querySelector("#ordersDEFAULT").style.display = "none";
  document.querySelector("#ordersVIEWORDER").style.display = "flex";

  //load order from firebase
  const order = await getDoc(doc(db, "orders", orderID));
  const orderData = order.data();
  
  //set order data
  document.querySelector("#ordersVIEWORDER").querySelector("#orders-newOrder-orderNumber").value = orderData.orderNumber;
  document.querySelector("#ordersVIEWORDER").querySelector("#orders-newOrder-customerName").value = orderData.customerName;
  document.querySelector("#ordersVIEWORDER").querySelector("#orders-newOrder-products").value = orderData.products;
  document.querySelector("#ordersVIEWORDER").querySelector("#orders-newOrder-paid").querySelector("input").checked = orderData.paid;
  document.querySelector("#ordersVIEWORDER").querySelector("#orders-newOrder-dateOrdered").value = orderData.dateOrdered.toDate().toISOString().split('T')[0];

  document.querySelector("#ordersVIEWORDER").setAttribute("orderID", orderID);
  await wait(500)
  await playLoadAnim();
  changingPages = false;
}

async function UpdateOrder(orderID) {
  if (changingPages) return;
  changingPages = true;
  document.querySelector(".V1GLOBAL_LoadingDiv").style.width = "100vw";
  await wait(1500);
  document.querySelector("#ordersDEFAULT").style.display = "flex";
  document.querySelector("#ordersVIEWORDER").style.display = "none";

  //upload to firebase
  const orderNumber = document.querySelector("#ordersVIEWORDER").querySelector("#orders-newOrder-orderNumber").value;
  const customerName = document.querySelector("#ordersVIEWORDER").querySelector("#orders-newOrder-customerName").value;
  const products = document.querySelector("#ordersVIEWORDER").querySelector("#orders-newOrder-products").value;  
  const paid = document.querySelector("#ordersVIEWORDER").querySelector("#orders-newOrder-paid").querySelector("input").checked;
  const dateOrdered = document.querySelector("#ordersVIEWORDER").querySelector("#orders-newOrder-dateOrdered").value;
  await updateDoc(doc(db, "orders", orderID) , {
    orderNumber: orderNumber,
    customerName: customerName,
    products: products,
    paid: paid,
    dateOrdered: Timestamp.fromDate(new Date(dateOrdered)),
  })
  await wait(500);
  window.location.reload();
}

async function DeleteOrder(orderID) {
  if (changingPages) return;
  changingPages = true;
  document.querySelector(".V1GLOBAL_LoadingDiv").style.width = "100vw";
  await wait(1500);
  document.querySelector("#ordersDEFAULT").style.display = "flex";
  document.querySelector("#ordersVIEWORDER").style.display = "none";
  await deleteDoc(doc(db, "orders", orderID));
  await wait(500);
  window.location.reload();
}
