import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, Timestamp, where, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

// --- LOGICA DE UI GENERAL (Menu y Tema) ---
const menuBtn = document.getElementById('menu-btn'); 
const sidePanel = document.getElementById('side-panel'); 
const overlay = document.getElementById('overlay');

function togglePanel() { 
    sidePanel.classList.toggle('open'); 
    overlay.classList.toggle('open'); 
    document.body.style.overflow = sidePanel.classList.contains('open') ? 'hidden' : 'auto'; 
}

if (menuBtn && sidePanel && overlay) {
    menuBtn.addEventListener('click', togglePanel); 
    overlay.addEventListener('click', togglePanel);
    sidePanel.addEventListener('click', (e) => { 
        const clickedLinkOrButton = e.target.closest('a') || e.target.closest('button'); 
        if (clickedLinkOrButton) { 
            if (e.target.closest('.social-button') || e.target.closest('#theme-toggle-btn')) { return; } 
            togglePanel(); 
        } 
    });
}

const themeToggleBtn = document.getElementById('theme-toggle-btn'); 
const darkIcon = document.getElementById('theme-icon-dark'); 
const lightIcon = document.getElementById('theme-icon-light');

function updateIcon() { 
    if (document.documentElement.classList.contains('dark')) { 
        darkIcon.classList.remove('hidden'); 
        lightIcon.classList.add('hidden'); 
    } else { 
        darkIcon.classList.add('hidden'); 
        lightIcon.classList.remove('hidden'); 
    } 
} 

if(themeToggleBtn) {
    updateIcon();
    themeToggleBtn.addEventListener('click', () => { 
        const isDark = document.documentElement.classList.toggle('dark'); 
        localStorage.theme = isDark ? 'dark' : 'light'; 
        updateIcon(); 
    });
}

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDip9cNWnSXTKYzBy95zDom8SVfbjdC-68",
  authDomain: "chepinas-burguer.firebaseapp.com",
  projectId: "chepinas-burguer",
  storageBucket: "chepinas-burguer.firebasestorage.app",
  messagingSenderId: "233011732997",
  appId: "1:233011732997:web:5039e5a9707beed914726c"
};
const app = initializeApp(firebaseConfig); 
const auth = getAuth(app); 
const db = getFirestore(app); 
const storage = getStorage(app);

// --- FUNCION DE COMPRESION ---
async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const maxWidth = 1080;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function() {
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (!blob) { reject(new Error('Error al comprimir imagen')); return; }
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                }, 'image/jpeg', 0.7); 
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}

// --- Referencias DOM ---
const adminLoginBtn=document.getElementById('admin-login-btn'), loginModal=document.getElementById('login-modal'), closeModalBtn=document.getElementById('close-modal-btn'), loginForm=document.getElementById('login-form'), emailInput=document.getElementById('email-input'), passwordInput=document.getElementById('password-input'), loginError=document.getElementById('login-error');
const adminLink=document.getElementById('admin-link'), logoutBtn=document.getElementById('logout-btn'), agendarCitaBtn=document.getElementById('agendar-cita-btn'), citasLink=document.getElementById('citas-link'), bannerConfigBtn=document.getElementById('banner-config-btn');
const adminModal=document.getElementById('admin-modal'), adminModalTitle=document.getElementById('admin-modal-title'), closeAdminModalBtn=document.getElementById('close-admin-modal-btn'), adminForm=document.getElementById('admin-form'), editDocIdInput=document.getElementById('edit-doc-id'), imageInput=document.getElementById('image-input'), categoryInput=document.getElementById('category-input'), descriptionInput=document.getElementById('description-input'), priceInput=document.getElementById('price-input'), adminError=document.getElementById('admin-error'), adminSubmitBtn=document.getElementById('admin-submit-btn'), adminSubmitText=document.getElementById('admin-submit-text'), adminSpinner=document.getElementById('admin-spinner'), galleryGrid=document.getElementById('gallery-grid'), categoryFiltersContainer=document.getElementById('category-filters');

// Referencias Banner
const bannerModal=document.getElementById('banner-modal'), closeBannerModalBtn=document.getElementById('close-banner-modal-btn'), bannerForm=document.getElementById('banner-form'), bannerUploadInput=document.getElementById('banner-upload-input'), bannerError=document.getElementById('banner-error'), bannerSubmitBtn=document.getElementById('banner-submit-btn'), bannerSubmitText=document.getElementById('banner-submit-text'), bannerSpinner=document.getElementById('banner-spinner'), heroBanner=document.getElementById('hero-banner'), heroBannerImg=document.getElementById('hero-banner-img');

const lightboxModal=document.getElementById('lightbox-modal'), lightboxImage=document.getElementById('lightbox-image');
const appointmentModal=document.getElementById('appointment-modal'), closeAppointmentModalBtn=document.getElementById('close-appointment-modal-btn'), step1Design=document.getElementById('step-1-design'), step2Datetime=document.getElementById('step-2-datetime'), step3Payment=document.getElementById('step-3-payment'), appointmentGalleryGrid=document.getElementById('appointment-gallery-grid'), appointmentNextStep1Btn=document.getElementById('appointment-next-step-1'), appointmentForm=document.getElementById('appointment-form'), appointmentName=document.getElementById('appointment-name'), appointmentPhone=document.getElementById('appointment-phone'), appointmentDate=document.getElementById('appointment-date'), appointmentErrorStep1=document.getElementById('appointment-error-step1'), appointmentErrorStep2=document.getElementById('appointment-error-step2'), paymentConcept=document.getElementById('payment-concept'), whatsappLink=document.getElementById('whatsapp-link'), appointmentConfirmBtn=document.getElementById('appointment-confirm-btn'), appointmentSubmitText=document.getElementById('appointment-submit-text'), appointmentSpinner=document.getElementById('appointment-spinner'), clientDesignUpload = document.getElementById('client-design-upload'), clientUploadPreview = document.getElementById('client-upload-preview'), clientUploadImg = document.getElementById('client-upload-img');
const appointmentTimeSlots = document.getElementById('appointment-time-slots'), appointmentTimeSlotsLoader = document.getElementById('appointment-time-slots-loader'), appointmentTimeSlotsPlaceholder = document.getElementById('appointment-time-slots-placeholder');
const citasModal=document.getElementById('citas-modal'), closeCitasModalBtn=document.getElementById('close-citas-modal-btn'), citasListContainer=document.getElementById('citas-list-container');

let selectedDesignForAppointment=null, clientUploadedFile=null, appointmentData={ selectedTime: null };
let isUserAdmin = false;
let allDesigns = []; // Array local para filtrar

// === INICIALIZAR ===
flatpickr("#appointment-date", { locale: "es", minDate: "today", disableMobile: "true", disable: [ function(date) { return (date.getDay() === 1 || date.getDay() === 2 || date.getDay() === 3 || date.getDay() === 4); } ], onChange: function(selectedDates, dateStr, instance) { populateAvailableTimes(dateStr); } });
loadBanner();

// === LÓGICA DE BANNER ===
async function loadBanner() {
    try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().bannerUrl) {
            heroBannerImg.src = docSnap.data().bannerUrl;
            heroBanner.classList.remove('hidden');
        }
    } catch (e) { console.log("No banner settings found"); }
}

bannerConfigBtn.addEventListener('click', (e) => { e.preventDefault(); bannerForm.reset(); bannerModal.classList.remove('hidden'); });
closeBannerModalBtn.addEventListener('click', () => bannerModal.classList.add('hidden'));

bannerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = bannerUploadInput.files[0];
    if (!file) return;
    
    bannerSubmitText.classList.add('hidden'); bannerSpinner.classList.remove('hidden'); bannerSubmitBtn.disabled = true;
    try {
        const compressed = await compressImage(file);
        const storageRef = ref(storage, 'settings/banner_img');
        await uploadBytes(storageRef, compressed);
        const url = await getDownloadURL(storageRef);
        
        await setDoc(doc(db, "settings", "general"), { bannerUrl: url }, { merge: true });
        heroBannerImg.src = url; heroBanner.classList.remove('hidden');
        bannerModal.classList.add('hidden');
    } catch (error) {
        console.error(error); bannerError.textContent = "Error al subir banner"; bannerError.classList.remove('hidden');
    } finally {
        bannerSubmitText.classList.remove('hidden'); bannerSpinner.classList.add('hidden'); bannerSubmitBtn.disabled = false;
    }
});

// === Funciones UI ===
function showAdminUI(){isUserAdmin=true;adminLink.classList.remove('hidden');citasLink.classList.remove('hidden');bannerConfigBtn.classList.remove('hidden');logoutBtn.classList.remove('hidden');adminLoginBtn.classList.add('hidden');adminLink.addEventListener('click',openAdminModalForCreate);citasLink.addEventListener('click',openCitasModal);}
function showVisitorUI(){isUserAdmin=false;adminLink.classList.add('hidden');citasLink.classList.add('hidden');bannerConfigBtn.classList.add('hidden');logoutBtn.classList.add('hidden');adminLoginBtn.classList.remove('hidden');adminLink.removeEventListener('click',openAdminModalForCreate);citasLink.removeEventListener('click',openCitasModal);}
function openLoginModal(){loginModal.classList.remove('hidden');} function closeLoginModal(){loginModal.classList.add('hidden');loginError.classList.add('hidden');loginForm.reset();}
function openAdminModalForCreate(e){if(e)e.preventDefault();adminForm.reset();editDocIdInput.value="";adminModalTitle.textContent="Registrar Nuevo Diseño";adminSubmitText.textContent="Guardar Diseño";adminModal.classList.remove('hidden');}
function openAdminModalForEdit(docId,fileName,description, price){
    const design = allDesigns.find(d => d.id === docId);
    adminForm.reset(); editDocIdInput.value=docId; adminModalTitle.textContent="Editar Diseño"; adminSubmitText.textContent="Actualizar Diseño";
    descriptionInput.value=description; priceInput.value = price; 
    if(design && design.category) categoryInput.value = design.category;
    adminModal.classList.remove('hidden');
}
function closeAdminModal(){adminModal.classList.add('hidden');adminError.classList.add('hidden');adminForm.reset();editDocIdInput.value="";}
function setAdminLoading(isLoading){if(isLoading){adminSubmitText.classList.add('hidden');adminSpinner.classList.remove('hidden');adminSubmitBtn.disabled=true;}else{adminSubmitText.classList.remove('hidden');adminSpinner.classList.add('hidden');adminSubmitBtn.disabled=false;}}
function setAppointmentLoading(isLoading){if(isLoading){appointmentSubmitText.classList.add('hidden');appointmentSpinner.classList.remove('hidden');appointmentConfirmBtn.disabled=true;}else{appointmentSubmitText.classList.remove('hidden');appointmentSpinner.classList.add('hidden');appointmentConfirmBtn.disabled=false;}}

// === Funciones Horarios ===
function timeToMinutes(timeStr) { const [hours, minutes] = timeStr.split(':').map(Number); return hours * 60 + minutes; }
function generateTimeSlots(startHour, endHour, intervalMinutes) {
    const slots = []; let current = new Date(); current.setHours(startHour, 0, 0, 0); const end = new Date(); end.setHours(endHour, 0, 0, 0);
    while (current <= end) { slots.push(current.toTimeString().slice(0, 5)); current.setMinutes(current.getMinutes() + intervalMinutes); }
    return slots;
}
async function getBookedTimes(dateString) {
    const bookedTimes = [];
    try { const q = query(collection(db, "appointments"), where("date", "==", dateString), where("status", "in", ["pendiente", "confirmada"])); const querySnapshot = await getDocs(q); querySnapshot.forEach((doc) => { bookedTimes.push(doc.data().time); }); return bookedTimes; } catch (error) { console.error("Error getting booked times: ", error); return []; }
}
async function populateAvailableTimes(dateString) {
    if (!dateString) { appointmentTimeSlots.innerHTML = ''; appointmentTimeSlotsPlaceholder.classList.remove('hidden'); appointmentTimeSlotsLoader.classList.add('hidden'); return; }
    appointmentTimeSlotsPlaceholder.classList.add('hidden'); appointmentTimeSlots.innerHTML = ''; appointmentTimeSlotsLoader.classList.remove('hidden'); appointmentData.selectedTime = null; 
    try {
        const allSlots = generateTimeSlots(10, 20, 30);
        const bookedSlots = await getBookedTimes(dateString);
        appointmentTimeSlotsLoader.classList.add('hidden');
        const SERVICE_DURATION = 180; 
        const availableSlots = allSlots.filter(slot => {
            const slotStart = timeToMinutes(slot); const slotEnd = slotStart + SERVICE_DURATION;
            const hasConflict = bookedSlots.some(bookedTime => { const bookedStart = timeToMinutes(bookedTime); const bookedEnd = bookedStart + SERVICE_DURATION; return (slotStart < bookedEnd) && (slotEnd > bookedStart); });
            return !hasConflict;
        });
        if (availableSlots.length === 0) { appointmentTimeSlots.innerHTML = '<p class="text-sm text-center text-red-500 col-span-full">No hay horarios disponibles (3hrs requeridas).</p>'; return; }
        availableSlots.forEach(slot => {
            const btn = document.createElement('button'); btn.type = "button"; btn.className = "time-slot-btn"; btn.textContent = slot; btn.dataset.time = slot;
            btn.addEventListener('click', () => { appointmentTimeSlots.querySelectorAll('.time-slot-btn').forEach(b => { b.classList.remove('selected'); }); btn.classList.add('selected'); appointmentData.selectedTime = slot; appointmentErrorStep2.classList.add('hidden'); });
            appointmentTimeSlots.appendChild(btn);
        });
    } catch (error) { console.error("Error populating times: ", error); appointmentTimeSlotsLoader.classList.add('hidden'); appointmentTimeSlots.innerHTML = '<p class="text-sm text-center text-red-500 col-span-full">Error al cargar horarios.</p>'; }
}

// === Lógica Auth ===
onAuthStateChanged(auth,(user)=>{if(user){showAdminUI();}else{showVisitorUI();}loadDesigns();});
adminLoginBtn.addEventListener('click',openLoginModal); closeModalBtn.addEventListener('click',closeLoginModal); loginModal.addEventListener('click',(e)=>{if(e.target===loginModal)closeLoginModal();});

loginForm.addEventListener('submit',async (e)=>{
    e.preventDefault();
    const email=emailInput.value,password=passwordInput.value;
    loginError.classList.add('hidden');
    try {
        await setPersistence(auth, browserLocalPersistence);
        await signInWithEmailAndPassword(auth,email,password);
        closeLoginModal();
    } catch(error) {
        loginError.textContent="Datos incorrectos.";
        loginError.classList.remove('hidden');
    }
});
logoutBtn.addEventListener('click',()=>{signOut(auth).catch((error)=>console.error("Error al cerrar sesión:",error));});

function getImageUrl(fileName) { if (!fileName) return ''; if (fileName.startsWith('http')) return fileName; return './' + fileName; }

// === DISEÑOS & CATEGORIAS (CORE) ===
async function loadDesigns(){
    galleryGrid.innerHTML=''; categoryFiltersContainer.innerHTML = '';
    try{
        const q=query(collection(db,"designs"),orderBy("createdAt","desc"));
        const querySnapshot=await getDocs(q);
        allDesigns = [];
        const categories = new Set();

        querySnapshot.forEach((doc)=>{
            const data = doc.data();
            data.id = doc.id;
            allDesigns.push(data);
            if(data.category) categories.add(data.category.trim());
        });

        // Render Categorias
        if(categories.size > 0) {
            const allBtn = document.createElement('button');
            allBtn.textContent = "Todas"; allBtn.className = "category-filter-btn active";
            allBtn.onclick = () => filterDesigns('all', allBtn);
            categoryFiltersContainer.appendChild(allBtn);

            categories.forEach(cat => {
                const btn = document.createElement('button');
                btn.textContent = cat; btn.className = "category-filter-btn";
                btn.onclick = () => filterDesigns(cat, btn);
                categoryFiltersContainer.appendChild(btn);
            });
        }

        renderGallery(allDesigns);

    }catch(error){console.error("Error al cargar diseños: ",error);galleryGrid.innerHTML='<p class="text-white col-span-full text-center">Error al cargar diseños.</p>';}
}

function filterDesigns(category, btn) {
    document.querySelectorAll('.category-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if(category === 'all') {
        renderGallery(allDesigns);
    } else {
        const filtered = allDesigns.filter(d => d.category && d.category.trim() === category);
        renderGallery(filtered);
    }
}

function renderGallery(designs) {
    galleryGrid.innerHTML = '';
    designs.forEach(design => {
        const imgSrc = getImageUrl(design.fileName);
        const cardElement=document.createElement('div');
        cardElement.className='gallery-card';
        cardElement.dataset.id=design.id;
        cardElement.dataset.filename=design.fileName; 
        cardElement.dataset.description=design.description||""; 
        cardElement.dataset.price = design.price || ""; 
        cardElement.dataset.category = design.category || "";

        let descriptionHTML=design.description?`<div class="gallery-description">${design.description}</div>`:`<div class="gallery-description"></div>`; 
        let priceHTML = design.price ? `<div class="gallery-price">${design.price}</div>` : ''; 
        let adminButtonsHTML='';
        if(isUserAdmin){
            adminButtonsHTML=`<div class="admin-controls"><button class="admin-btn admin-btn-edit" aria-label="Editar"><svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button><button class="admin-btn admin-btn-delete" aria-label="Eliminar"><svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div>`;
        }
        cardElement.innerHTML=`<div class="gallery-item"><img src="${imgSrc}" alt="${design.description||'Diseño'}" class="w-full h-full object-contain bg-black">${adminButtonsHTML}</div>${priceHTML}${descriptionHTML}`;
        galleryGrid.appendChild(cardElement);
    });
}

closeAdminModalBtn.addEventListener('click',closeAdminModal); adminModal.addEventListener('click',(e)=>{if(e.target===adminModal)closeAdminModal();});

// === SUBMIT CON COMPRESION Y CATEGORIA ===
adminForm.addEventListener('submit',async(e)=>{
    e.preventDefault();
    adminError.classList.add('hidden');
    let file = imageInput.files[0];
    const description=descriptionInput.value;
    const price=priceInput.value;
    const category=categoryInput.value;
    const docIdToEdit=editDocIdInput.value;
    if(!docIdToEdit && !file){ adminError.textContent = "Debes seleccionar una imagen."; adminError.classList.remove('hidden'); return; }
    setAdminLoading(true);
    try{
        let finalFileName = null;
        if(file){
            try { file = await compressImage(file); } catch(err) { console.error("Error compresión, subiendo original", err); }
            const uniqueName = Date.now() + '_' + file.name;
            const storageRef = ref(storage, 'designs/' + uniqueName);
            await uploadBytes(storageRef, file);
            finalFileName = await getDownloadURL(storageRef);
        }
        const designData={ description, price, category };
        if(docIdToEdit){ if(finalFileName) { designData.fileName = finalFileName; } await updateDoc(doc(db,"designs",docIdToEdit),designData); }
        else{ designData.fileName = finalFileName; designData.createdAt=Timestamp.fromDate(new Date()); await addDoc(collection(db,"designs"),designData); }
        setAdminLoading(false); closeAdminModal(); loadDesigns();
    }catch(error){ console.error("Error al guardar: ",error); adminError.textContent="Error al guardar."; adminError.classList.remove('hidden'); setAdminLoading(false); }
});

// === BORRAR CON LIMPIEZA ===
galleryGrid.addEventListener('click',async(e)=>{
    const editBtn=e.target.closest('.admin-btn-edit'),deleteBtn=e.target.closest('.admin-btn-delete'),card=e.target.closest('.gallery-card');
    if(editBtn){const{id,filename,description, price}=card.dataset;openAdminModalForEdit(id,filename,description, price);return;}
    if(deleteBtn){ 
        const{id, filename}=card.dataset; 
        if(confirm(`¿Eliminar este diseño y su imagen?`)){ 
            try{ 
                if (filename && filename.startsWith('http')) { try { const fileRef = ref(storage, filename); await deleteObject(fileRef); } catch (err) {} }
                await deleteDoc(doc(db,"designs",id)); 
                loadDesigns(); 
            }catch(error){console.error("Error borrar:",error);alert("Error al eliminar.");} 
        } 
        return; 
    }
    if(card){const img=card.querySelector('img');if(img){lightboxImage.src=img.src;lightboxModal.classList.remove('hidden');}}
});

// === Lógica Lightbox ===
function closeLightboxModal(){lightboxModal.classList.add('hidden');lightboxImage.src="";} lightboxModal.addEventListener('click',closeLightboxModal);

// === Lógica Modal de Citas (CON UPLOAD DE CLIENTE) ===

// Listener para el input de archivo del cliente
clientDesignUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            clientUploadImg.src = e.target.result;
            clientUploadPreview.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
        clientUploadedFile = file;
        selectedDesignForAppointment = null; // Limpiar selección de grid
        clientDesignUpload.parentElement.querySelector('label').classList.add('selected');
        appointmentGalleryGrid.querySelectorAll('.appointment-design').forEach(el=>el.classList.remove('selected'));
        appointmentErrorStep1.classList.add('hidden');
    }
});

async function loadDesignsForAppointment(){
    appointmentGalleryGrid.innerHTML='';
    try{
        const q=query(collection(db,"designs"),orderBy("createdAt","desc"));
        const querySnapshot=await getDocs(q);
        querySnapshot.forEach((doc)=>{
            const design=doc.data();
            const imgSrc = getImageUrl(design.fileName);
            const cardElement=document.createElement('div');
            cardElement.className='appointment-design gallery-item';
            cardElement.dataset.filename=design.fileName; 
            // IMAGEN ABSOLUTA
            cardElement.innerHTML=`<img src="${imgSrc}" alt="${design.description||'Diseño'}">`;
            cardElement.addEventListener('click',()=>{
                appointmentGalleryGrid.querySelectorAll('.appointment-design').forEach(el=>el.classList.remove('selected'));
                cardElement.classList.add('selected');
                selectedDesignForAppointment=design.fileName; 
                clientUploadedFile = null;
                clientDesignUpload.value = ""; 
                clientUploadPreview.classList.add('hidden');
                clientDesignUpload.parentElement.querySelector('label').classList.remove('selected');
                appointmentErrorStep1.classList.add('hidden');
            });
            appointmentGalleryGrid.appendChild(cardElement);
        });
    }catch(error){console.error("Error al cargar diseños cita: ",error);}
}

function openAppointmentModal(){
    step1Design.classList.remove('hidden');step2Datetime.classList.add('hidden');step3Payment.classList.add('hidden');
    appointmentForm.reset(); 
    selectedDesignForAppointment=null; 
    clientUploadedFile = null;
    appointmentData={ selectedTime: null }; 
    clientDesignUpload.value = "";
    clientUploadPreview.classList.add('hidden');
    if(clientDesignUpload.parentElement.querySelector('label')) clientDesignUpload.parentElement.querySelector('label').classList.remove('selected');

    appointmentErrorStep1.classList.add('hidden'); appointmentErrorStep2.classList.add('hidden');
    appointmentTimeSlots.innerHTML = ''; appointmentTimeSlotsPlaceholder.classList.remove('hidden'); appointmentTimeSlotsLoader.classList.add('hidden');
    loadDesignsForAppointment();
    appointmentModal.classList.remove('hidden');
}
function closeAppointmentModal(){appointmentModal.classList.add('hidden');appointmentForm.reset();}
agendarCitaBtn.addEventListener('click',(e)=>{e.preventDefault();openAppointmentModal();}); closeAppointmentModalBtn.addEventListener('click',closeAppointmentModal);

appointmentNextStep1Btn.addEventListener('click',()=>{
    if(!selectedDesignForAppointment && !clientUploadedFile){
        appointmentErrorStep1.classList.remove('hidden');
        return;
    }
    if(selectedDesignForAppointment) {
        appointmentData.design = selectedDesignForAppointment;
        appointmentData.isCustomUpload = false;
    } else {
        appointmentData.design = "pending_upload"; // Placeholder
        appointmentData.isCustomUpload = true;
    }
    step1Design.classList.add('hidden');
    step2Datetime.classList.remove('hidden');
});

appointmentForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    appointmentErrorStep2.classList.add('hidden');
    const name = appointmentName.value; const phone = appointmentPhone.value; const date = appointmentDate.value; const time = appointmentData.selectedTime; 
    if(!name || !phone || !date || !time){ appointmentErrorStep2.textContent="Todos los campos son obligatorios."; appointmentErrorStep2.classList.remove('hidden'); return; }
    
    const d = new Date(date+'T00:00:00');
    const selectedDay=d.getDay();
    if([1,2,3,4].includes(selectedDay)){ appointmentErrorStep2.textContent="Solo Viernes, Sábado y Domingo."; appointmentErrorStep2.classList.remove('hidden'); return; }
    
    appointmentData.name=name; appointmentData.phone=phone; appointmentData.date=date; appointmentData.time=time; 
    paymentConcept.textContent=name;
    const whatsappMsg=encodeURIComponent(`Hola ARI Nails, soy ${name} (${phone}) y quiero agendar para el ${date} a las ${time}. Diseño seleccionado. Adjunto comprobante.`);
    whatsappLink.href=`https://wa.me/528999104919?text=${whatsappMsg}`;
    step2Datetime.classList.add('hidden');step3Payment.classList.remove('hidden');
});

appointmentConfirmBtn.addEventListener('click',async()=>{
    setAppointmentLoading(true);
    try{
        if (appointmentData.isCustomUpload && clientUploadedFile) {
            try {
                let fileToUpload = clientUploadedFile;
                try { fileToUpload = await compressImage(clientUploadedFile); } catch(err) { console.warn("Fallo compresión cliente", err); }
                const uniqueName = 'client_' + Date.now() + '_' + fileToUpload.name;
                const storageRef = ref(storage, 'client-uploads/' + uniqueName);
                await uploadBytes(storageRef, fileToUpload);
                const url = await getDownloadURL(storageRef);
                appointmentData.design = url; 
            } catch(uploadErr) {
                console.error("Error subiendo imagen cliente", uploadErr);
                alert("Hubo un error subiendo tu imagen. Intentaremos agendar sin ella.");
                appointmentData.design = "Error subida imagen";
            }
        }

        appointmentData.createdAt=Timestamp.fromDate(new Date()); appointmentData.status='pendiente';
        delete appointmentData.isCustomUpload; 

        await addDoc(collection(db,"appointments"),appointmentData);
        setAppointmentLoading(false);
        step3Payment.innerHTML=`<h2 class="text-2xl font-bold text-center mb-4 font-cursive dark:text-pink-100">¡Cita Pre-registrada!</h2><p class="text-center text-gray-700 dark:text-gray-100">Envía tu comprobante por WhatsApp para finalizar.</p>`;
        setTimeout(closeAppointmentModal,4000);
    }catch(error){console.error("Error guardar cita: ",error);setAppointmentLoading(false);alert("Error al registrar.");}
});

// === Lógica Modal Admin Citas ===
function openCitasModal(e){e.preventDefault();citasListContainer.innerHTML='<p class="text-center dark:text-pink-100">Cargando citas...</p>';loadAppointments();citasModal.classList.remove('hidden');}
function closeCitasModal(){citasModal.classList.add('hidden');} closeCitasModalBtn.addEventListener('click',closeCitasModal);

async function loadAppointments(){
    try{
        const q=query(collection(db,"appointments"),orderBy("date","asc"),orderBy("time","asc"));
        const querySnapshot=await getDocs(q);
        if(querySnapshot.empty){ citasListContainer.innerHTML='<p class="text-center dark:text-pink-100">No hay citas.</p>'; return; }
        citasListContainer.innerHTML='';
        querySnapshot.forEach(doc=>{
            const cita=doc.data(),citaId=doc.id,status=cita.status||'pendiente';
            const dateParts = cita.date.split('-'); const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
            const formattedDate = dateObj.toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
            let statusClass='',statusText='';
            switch(status){ case'confirmada':statusClass='cita-status-confirmada';statusText='Confirmada';break; case'cancelada':statusClass='cita-status-cancelada';statusText='Cancelada';break; default:statusClass='cita-status-pendiente';statusText='Pendiente'; }
            let actionButtonsHTML='';
            if(status!=='cancelada'){ if(status==='pendiente'){ actionButtonsHTML+=`<button data-id="${citaId}" class="cita-action-btn confirm-btn mr-1">Confirmar</button>`; } actionButtonsHTML+=`<button data-id="${citaId}" class="cita-action-btn cancel-btn mr-1">Cancelar</button>`; }
            actionButtonsHTML+=`<button data-id="${citaId}" class="cita-action-btn delete-cita-btn bg-gray-700 text-white hover:bg-gray-900">Eliminar</button>`;
            const imgSrc = getImageUrl(cita.design);
            const isClientUpload = cita.design && cita.design.includes('client-uploads');
            const uploadLabel = isClientUpload ? '<span class="text-[10px] bg-blue-100 text-blue-800 px-1 rounded">Diseño Propio</span>' : '';
            const designHTML = cita.design ? `<div class="flex items-center gap-2 mt-1"><img src="${imgSrc}" class="w-12 h-12 object-contain rounded-md bg-gray-200 dark:bg-gray-700 cursor-pointer admin-cita-img"><div><p class="text-xs truncate w-32">Ver diseño</p>${uploadLabel}</div></div>` : '<p class="text-sm">Sin diseño</p>';
            const citaElement=document.createElement('div');
            citaElement.className='cita-item p-4 flex justify-between items-center flex-wrap gap-2';
            citaElement.innerHTML=`<div><h3 class="font-bold text-lg text-pink-700 dark:text-pink-300">${cita.name}</h3><p class="font-semibold">${formattedDate} - ${cita.time}</p><p class="text-sm">Tel: ${cita.phone||'N/A'}</p>${designHTML}<p class="text-sm font-semibold ${statusClass} mt-2">Estado: ${statusText}</p></div><div class="flex-shrink-0 mt-2 sm:mt-0">${actionButtonsHTML}</div>`;
            citasListContainer.appendChild(citaElement);
        });
    } catch(error) { console.error("Error citas: ",error); citasListContainer.innerHTML='<p class="text-center text-red-500">Error al cargar.</p>'; }
}

citasListContainer.addEventListener('click', async (e) => {
    const confirmBtn = e.target.closest('.confirm-btn'), cancelBtn = e.target.closest('.cancel-btn'), deleteBtn = e.target.closest('.delete-cita-btn'), imgBtn = e.target.closest('.admin-cita-img');
    if (imgBtn) { e.preventDefault(); lightboxImage.src = imgBtn.src; lightboxModal.classList.remove('hidden'); return; }
    if (confirmBtn) { const citaId = confirmBtn.dataset.id; confirmBtn.disabled=true; await updateDoc(doc(db,"appointments",citaId),{status:'confirmada'}); loadAppointments(); }
    if (cancelBtn) { const citaId = cancelBtn.dataset.id; if(confirm("¿Cancelar cita?")){ cancelBtn.disabled=true; await updateDoc(doc(db,"appointments",citaId),{status:'cancelada'}); loadAppointments(); } }
    if (deleteBtn) { const citaId = deleteBtn.dataset.id; if(confirm("¿ELIMINAR PERMANENTEMENTE?")){ deleteBtn.disabled=true; await deleteDoc(doc(db,"appointments",citaId)); loadAppointments(); } }
});
