

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .then(() => console.log("Aplicația SPARKY este gata de utilizare mobilă!"))
    .catch((err) => console.error("Eroare înregistrare aplicație:", err))
}



// ==========================================================
// CASETA TA MUZICALĂ YOUTUBE (ID-uri oficiale verificate)
// Cum iei ID-ul: din ://youtube.com -> iei doar GJ2X9SANsME
// ==========================================================

// CASETA TA MUZICALĂ YOUTUBE (ID-uri verificate fără restricții)
// ==========================================================

let casetaYoutube = [];
let indexPiesa = 0;
let casetaPornita = false;
let ytPlayer = null;

// 1. Încărcăm API-ul oficial YouTube
(function incarcaAPI() {
    if (document.getElementById('yt-iframe-api')) return;
    const tag = document.createElement('script');
    tag.id = 'yt-iframe-api';
    const domeniu = 'www.' + 'youtube' + '.com';
    tag.src = ['https:', '', domeniu, 'iframe_api'].join('/');
    document.head.appendChild(tag);
})();

// 2. Curățare (.trim) și extragere ID din orice format de link YouTube (fără Regex)
function extrageIdYoutube(textBrut) {
    const curatat = textBrut.trim();
    if (!curatat) return null;

    if (curatat.length === 11 && !curatat.includes('/') && !curatat.includes('.')) {
        return curatat;
    }

    try {
        const linkComplet = curatat.startsWith('http') ? curatat : 'https://' + curatat;
        const urlObj = new URL(linkComplet);

        if (urlObj.searchParams.has('v')) {
            const id = urlObj.searchParams.get('v');
            return (id && id.length === 11) ? id : null;
        }

        const segmente = urlObj.pathname.split('/').filter(Boolean);
        const ultimulSegment = segmente.at(-1);
        if (ultimulSegment && ultimulSegment.length === 11) {
            return ultimulSegment;
        }
    } catch (e) {
        return null;
    }

    return null;
}

// 3. Preluare automată a titlului real de pe YouTube
async function aflaTitluYoutube(videoId) {
    try {
        const domeniu = 'www.' + 'youtube' + '.com';
        const urlVideo = ['https:', '', domeniu, 'watch?v=' + videoId].join('/');
        const urlOembed = ['https:', '', domeniu, 'oembed?url=' + encodeURIComponent(urlVideo) + '&format=json'].join('/');
        
        const raspuns = await fetch(urlOembed);
        if (!raspuns.ok) return 'Piesă adăugată (' + videoId + ')';
        
        const date = await raspuns.json();
        return date.title || ('Piesă adăugată (' + videoId + ')');
    } catch (e) {
        return 'Piesă adăugată (' + videoId + ')';
    }
}

// 4. Încărcăm playlist.json + melodiile salvate local în browser
async function obtinePlaylist() {
    if (casetaYoutube.length > 0) return casetaYoutube;
    try {
        const raspuns = await fetch('playlist.json');
        const listaBaza = await raspuns.json();
        const listaSalvataLocal = JSON.parse(localStorage.getItem('sparky_playlist_extra') || '[]');
        casetaYoutube = [...listaBaza, ...listaSalvataLocal];
        return casetaYoutube;
    } catch (eroare) {
        console.error("Eroare la încărcarea playlist.json:", eroare);
        return [];
    }
}

// 5. Actualizează textul "LINK" cu titlul melodiei sau îl readuce la "LINK"
function actualizeazaTextStatus(text) {
     const statusEl = document.getElementById('statusMelodie');
    if (statusEl) {
        statusEl.textContent = text;
    }
}

// 6. Ascultăm tasta Enter în fereastra de introducere
// document.addEventListener('DOMContentLoaded', () => {
//     const inputLink = document.getElementById('inputLinkNou');
//     if (!inputLink) return;

//     inputLink.addEventListener('keydown', async (e) => {
//         if (e.key === 'Enter') {
//             e.preventDefault();
//             const idExtras = extrageIdYoutube(inputLink.value);

//             if (!idExtras) {
//                 actualizeazaTextStatus('Link invalid!');
//                 setTimeout(() => actualizeazaTextStatus(casetaPornita ? casetaYoutube[indexPiesa].titlu : 'LINK'), 2000);
//                 return;
//             }

//             actualizeazaTextStatus('Se preia titlul...');
//             await obtinePlaylist();

//             const existaDeja = casetaYoutube.some(p => p.id === idExtras);
//             if (!existaDeja) {
//                 const titluReal = await aflaTitluYoutube(idExtras);
//                 const piesaNoua = { id: idExtras, titlu: titluReal };
                
//                 casetaYoutube.push(piesaNoua);

//                 const listaLocala = JSON.parse(localStorage.getItem('sparky_playlist_extra') || '[]');
//                 listaLocala.push(piesaNoua);
//                 localStorage.setItem('sparky_playlist_extra', JSON.stringify(listaLocala));
                
//                 actualizeazaTextStatus('Salvat: ' + titluReal);
//             } else {
//                 actualizeazaTextStatus('Există deja în casetă!');
//             }

//             inputLink.value = '';
//             setTimeout(() => {
//                 actualizeazaTextStatus(casetaPornita ? casetaYoutube[indexPiesa].titlu : 'LINK');
//             }, 2200);
//         }
//     });
// });

// 6. Ascultăm tasta Enter în fereastra de introducere
// 6. Comutare la click (dispare textul -> apare căsuța) + salvare la Enter
// 6. Funcții directe pentru căsuța de introducere melodii
// 1. La click pe banda You Tube: deschide caseta + extinde consola pe mobil
function deschideCasutaYoutube() {
    const textOriginal = document.getElementById('textOriginalYoutube');
    const panouInput = document.getElementById('panouInputYoutube');
    const inputLink = document.getElementById('inputLinkNou');
    const zonaControl = document.getElementById('zonaControlLista');
    const lista = document.querySelector('.ListaLinkuri');
  document.querySelector('.ListaLinkuri')?.classList.add('studio-extins');

    if (!textOriginal || !panouInput || !inputLink) return;

    if (lista) lista.classList.add('studio-extins'); // <-- Extinde consola pe 2 etaje

    textOriginal.classList.add('ascuns');
    panouInput.classList.remove('ascuns');
    if (zonaControl) zonaControl.classList.add('input-activ');
    inputLink.focus();
}


function inchideCasutaYoutube(mesajTemporar) {
    const textOriginal = document.getElementById('textOriginalYoutube');
    const panouInput = document.getElementById('panouInputYoutube');
    const zonaControl = document.getElementById('zonaControlLista');

    if (!textOriginal || !panouInput) return;

    panouInput.classList.add('ascuns');
    textOriginal.classList.remove('ascuns');
    if (zonaControl) zonaControl.classList.remove('input-activ');
    if (mesajTemporar) {
        actualizeazaTextStatus(mesajTemporar);
        setTimeout(() => actualizeazaTextStatus('LINK'), 1800);
    }
}
// 1. Click oriunde pe banda YouTube (când e închisă -> deschide DOAR consola; pe desktop -> deschide inputul)
function gestioneazaClickYoutube() {
    const lista = document.querySelector('.ListaLinkuri');
    const esteMobil = window.matchMedia('(max-width: 750px) and (orientation: portrait), (max-height: 550px) and (orientation: landscape)').matches;

    if (esteMobil && lista && !lista.classList.contains('studio-extins')) {
        // Prima apăsare pe mobil: deschide DOAR consola, FĂRĂ input
        lista.classList.add('studio-extins');
        return;
    }

    // Dacă e desktop sau consola e deja deschisă: deschide inputul
    deschideCasutaYoutube();
}

// 2. Click în partea stângă (pe You Tube / LINK) -> dacă consola e închisă o deschide; dacă e deschisă activează inputul
function deschideInputInConsola() {
    const lista = document.querySelector('.ListaLinkuri');
    const esteMobil = window.matchMedia('(max-width: 750px) and (orientation: portrait), (max-height: 550px) and (orientation: landscape)').matches;

    if (esteMobil && lista && !lista.classList.contains('studio-extins')) {
        lista.classList.add('studio-extins');
        return;
    }

    deschideCasutaYoutube();
}
function inchideStudioYoutube() {
    document.querySelector('.ListaLinkuri')?.classList.remove('studio-extins');
    inchideCasutaYoutube();
}
async function verificaEnterLink(e) {
    const inputLink = e.target;

    if (e.key === 'Escape') {
        inputLink.value = '';
        inchideCasutaYoutube();
        return;
    }

    if (e.key === 'Enter') {
        e.preventDefault();
        const idExtras = extrageIdYoutube(inputLink.value);

        if (!idExtras) {
            inputLink.value = '';
            inchideCasutaYoutube('Link invalid!');
            return;
        }

        inputLink.disabled = true;
        inputLink.placeholder = 'Se salvează...';

        await obtinePlaylist();

        const existaDeja = casetaYoutube.some(p => p.id === idExtras);
        let mesaj = 'Există deja!';

        if (!existaDeja) {
            const titluReal = await aflaTitluYoutube(idExtras);
            const piesaNoua = { id: idExtras, titlu: titluReal };
            casetaYoutube.push(piesaNoua);

            const listaLocala = JSON.parse(localStorage.getItem('sparky_playlist_extra') || '[]');
            listaLocala.push(piesaNoua);
            localStorage.setItem('sparky_playlist_extra', JSON.stringify(listaLocala));

            console.log('Adaugă în playlist.json:\n' + JSON.stringify(piesaNoua) + ',');
            mesaj = 'Salvat!';
        }

        inputLink.value = '';
        inputLink.disabled = false;
        inputLink.placeholder = 'Lipește link YouTube + Enter';
        inchideCasutaYoutube(mesaj);
    }
}

// Închide căsuța dacă dai click oriunde în afara benzii
document.addEventListener('click', (e) => {
    const zonaControl = document.getElementById('zonaControlLista');
    const panouInput = document.getElementById('panouInputYoutube');
    if (zonaControl && panouInput && !zonaControl.contains(e.target) && !panouInput.classList.contains('ascuns')) {
        inchideCasutaYoutube();
    }
});
// 7. Butonul tău de Pornire / Oprire
async function comutaPlaylistInBanda() {
    const zonaVideo = document.getElementById('zonaVideoYoutube');
    const buton = document.getElementById('toggleYoutube');

    if (!zonaVideo || !buton) return;

    if (!casetaPornita) {
        // Am eliminat document.body.appendChild(zonaVideo) ca să NU îi mai schimbe poziția!
        zonaVideo.style.display = 'block';
        zonaVideo.classList.add('activ');
        buton.classList.add('pornit');
        casetaPornita = true;

        await obtinePlaylist();
        if (casetaYoutube.length === 0) return;

        indexPiesa = Math.floor(Math.random() * casetaYoutube.length);
        pornestePiesaCuAPI(indexPiesa);
    } else {
        casetaPornita = false;
        if (ytPlayer && typeof ytPlayer.destroy === 'function') {
            try {
                ytPlayer.destroy();
            } catch (e) {}
            ytPlayer = null;
        }
        zonaVideo.innerHTML = '';
        zonaVideo.classList.remove('activ');
        zonaVideo.style.display = '';
        buton.classList.remove('pornit');
        actualizeazaTextStatus('LINK');
    }
}

// 8. Motorul oficial YT.Player (cu ID unic la fiecare pornire ca să meargă de 100 de ori la rând)
function pornestePiesaCuAPI(index) {
    const zonaVideo = document.getElementById('zonaVideoYoutube');
    if (!zonaVideo || casetaYoutube.length === 0 || !casetaPornita) return;

    // Construim lista completă de ID-uri începând cu piesa aleasă aleatoriu
    const listaRearanjata = [
        ...casetaYoutube.slice(index),
        ...casetaYoutube.slice(0, index)
    ];
    const listaIdUri = listaRearanjata.map(p => p.id);

    actualizeazaTextStatus(listaRearanjata[0].titlu);

    // Salvăm lista ordonată ca să știm exact ce titlu afișăm la fiecare schimbare
    window._playlistActiv = listaRearanjata;

    if (ytPlayer && typeof ytPlayer.loadPlaylist === 'function') {
        ytPlayer.loadPlaylist(listaIdUri);
        return;
    }

    const idUnicBox = 'ytPlayerBox_' + Date.now();
    zonaVideo.innerHTML = '<div id="' + idUnicBox + '"></div>';

    if (window.YT && window.YT.Player) {
        creeazaInstantaPlayer(listaIdUri, idUnicBox);
    } else {
        window.onYouTubeIframeAPIReady = () => {
            if (casetaPornita) creeazaInstantaPlayer(listaIdUri, idUnicBox);
        };
    }
}

function creeazaInstantaPlayer(listaIdUri, containerId) {
    ytPlayer = new YT.Player(containerId, {
        height: '100%',
        width: '100%',
        videoId: listaIdUri[0],
        playerVars: {
            autoplay: 1,
            playsinline: 1,
            controls: 1,
            rel: 0,
            loop: 1,
            playlist: listaIdUri.join(','), // Îi dăm tot playlistul nativ YouTube!
            modestbranding: 1,
            origin: window.location.origin
        },
        events: {
            onReady: (event) => {
                if (casetaPornita) {
                    event.target.playVideo();
                }
            },
            onStateChange: (event) => {
                // Când începe o piesă nouă din playlist (starea 1 = PLAYING), actualizăm titlul automat!
                if (event.data === 1 && casetaPornita && typeof ytPlayer.getPlaylistIndex === 'function') {
                    const idxPlaylist = ytPlayer.getPlaylistIndex();
                    if (window._playlistActiv && window._playlistActiv[idxPlaylist]) {
                        actualizeazaTextStatus(window._playlistActiv[idxPlaylist].titlu);
                    }
                }
            },
            onError: () => {
                if (ytPlayer && typeof ytPlayer.nextVideo === 'function') {
                    ytPlayer.nextVideo();
                }
            }
        }
    });
}
