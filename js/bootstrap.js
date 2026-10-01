import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, setDoc, getDoc, getDocs, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const featureFiles = [
  "core.js", "master-data.js", "navigation.js", "employee.js", "auth.js",
  "chat.js", "orders.js", "inventory.js", "application.js"
];

async function startApplication() {
  const sources = await Promise.all(featureFiles.map(async (file) => {
    const response = await fetch(new URL(`./features/${file}`, import.meta.url));
    if (!response.ok) throw new Error(`${file} の読み込みに失敗しました (${response.status})`);
    return response.text();
  }));

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const parameters = [
    "initializeApp", "getAuth", "createUserWithEmailAndPassword", "signInWithEmailAndPassword",
    "signOut", "onAuthStateChanged", "updatePassword", "getFirestore", "collection", "addDoc",
    "onSnapshot", "query", "orderBy", "doc", "deleteDoc", "updateDoc", "setDoc", "getDoc",
    "getDocs", "where", "getStorage", "ref", "uploadBytes", "getDownloadURL"
  ];
  const runtime = new AsyncFunction(...parameters, `"use strict";
${sources.join("

")}`);
  await runtime(
    initializeApp, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, onAuthStateChanged, updatePassword, getFirestore, collection, addDoc,
    onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, setDoc, getDoc,
    getDocs, where, getStorage, ref, uploadBytes, getDownloadURL
  );
}

startApplication().catch((error) => {
  console.error("アプリケーションの起動に失敗しました。", error);
  const container = document.getElementById("toast-container");
  if (container) container.textContent = `起動エラー: ${error.message}`;
});
