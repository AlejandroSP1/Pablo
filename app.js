// Ya NO uses imports aquí porque Firebase ya está incluido desde el HTML con <script>

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAM8StsoNs-nCcaEVO-PQOBEVUBV19Fi_0",
  authDomain: "proasp-934e7.firebaseapp.com",
  projectId: "proasp-934e7",
  storageBucket: "proasp-934e7.appspot.com",
  messagingSenderId: "442869328723",
  appId: "1:442869328723:web:54f5442fd9c77d99178fa6",
  measurementId: "G-TK68ZJ5TPK"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

function esEmailValido(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function limpiarCamposAuth() {
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
}

function limpiarCamposReserva() {
  document.getElementById("fecha").value = "";
  document.getElementById("hora").value = "";
  document.getElementById("laboratorio").value = "";
}

function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  if (!esEmailValido(email)) {
    alert("Correo electrónico inválido.");
    return;
  }

  if (password.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("Usuario registrado");
      limpiarCamposAuth();
    })
    .catch(e => alert("Error: " + e.message));
}

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  if (!esEmailValido(email)) {
    alert("Correo electrónico inválido.");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Bienvenido");
      limpiarCamposAuth();
    })
    .catch(e => alert("Error: " + e.message));
}

function logout() {
  auth.signOut().then(() => alert("Sesión cerrada"));
}

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("reserva-section").style.display = "block";
    document.getElementById("user-info").innerText = `Usuario: ${user.email}`;
    mostrarReservas(user.uid);
  } else {
    document.getElementById("login-section").style.display = "block";
    document.getElementById("reserva-section").style.display = "none";
  }
});

function reservar() {
  const fecha = document.getElementById("fecha").value.trim();
  const hora = document.getElementById("hora").value.trim();
  const lab = document.getElementById("laboratorio").value.trim();
  const user = auth.currentUser;

  if (!fecha || !hora || !lab) {
    alert("Todos los campos son obligatorios para reservar.");
    return;
  }

  const fechaHoraReserva = new Date(`${fecha}T${hora}:00`);
  const ahora = new Date();

  if (fechaHoraReserva <= ahora) {
    alert("No se puede reservar para una fecha y hora pasada o igual a la actual.");
    return;
  }

  if (user) {
    db.collection("reservas")
      .where("fecha", "==", fecha)
      .where("laboratorio", "==", lab)
      .get()
      .then(snapshot => {
        let conflicto = false;

        snapshot.forEach(doc => {
          const data = doc.data();
          const fechaHoraExistente = new Date(`${data.fecha}T${data.hora}:00`);
          const diffMs = Math.abs(fechaHoraReserva - fechaHoraExistente);
          const diffMinutos = diffMs / (1000 * 60);

          if (diffMinutos < 60) {
            conflicto = true;
          }
        });

        if (conflicto) {
          alert("No se puede reservar en ese laboratorio con menos de 1 hora de diferencia respecto a otra reserva.");
          return;
        }

        let existe = false;
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.hora === hora && data.laboratorio === lab) {
            existe = true;
          }
        });

        if (existe) {
          alert("Ya existe una reserva para ese laboratorio, fecha y hora.");
          return;
        }

        return db.collection("reservas").add({
          uid: user.uid,
          email: user.email,
          fecha,
          hora,
          laboratorio: lab
        });
      })
      .then(() => {
        alert("Reservación registrada");
        limpiarCamposReserva();
        mostrarReservas(user.uid);
      })
      .catch(e => alert("Error: " + e.message));
  }
}

function mostrarReservas(uid) {
  db.collection("reservas")
    .where("uid", "==", uid)
    .get()
    .then(snapshot => {
      const lista = document.getElementById("lista-reservas");
      lista.innerHTML = "";
      snapshot.forEach(doc => {
        const data = doc.data();
        const li = document.createElement("li");
        li.innerText = `${data.fecha} - ${data.hora} - ${data.laboratorio}`;
        lista.appendChild(li);
      });
    })
    .catch(e => alert("Error al mostrar reservas: " + e.message));
}
