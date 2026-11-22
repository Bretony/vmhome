

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
// ==========================================================
// 6. CONTROL CONSOLĂ ȘI CASETĂ INTRODUCERE MELODII
// ==========================================================

// Când dai click pe banda YouTube
function gestioneazaClickYoutube() {
    const banda = document.getElementById('zonaControlLista');
    if (!banda) return;

    // Dacă consola nu e deschisă, o deschidem (arătăm butoanele și săgeata de închidere)
    if (!banda.classList.contains('consola-deschisa')) {
        banda.classList.add('consola-deschisa');
    } else {
        // Dacă e deja deschisă, deschidem direct caseta de input
        deschideInputInConsola();
    }
}

// Deschide caseta de lipit link-ul YouTube
function deschideInputInConsola() {
    const banda = document.getElementById('zonaControlLista');
    const textOriginal = document.getElementById('textOriginalYoutube');
    const panouInput = document.getElementById('panouInputYoutube');
    const inputLink = document.getElementById('inputLinkNou');

    if (!textOriginal || !panouInput || !inputLink) return;

    if (banda) banda.classList.add('consola-deschisa');
    textOriginal.classList.add('ascuns');
    panouInput.classList.remove('ascuns');
    inputLink.focus();
}

// Închide doar caseta de input (revine la textul You Tube / LINK)
function inchideCasutaYoutube(mesajTemporar) {
    const textOriginal = document.getElementById('textOriginalYoutube');
    const panouInput = document.getElementById('panouInputYoutube');

    if (!textOriginal || !panouInput) return;

    panouInput.classList.add('ascuns');
    textOriginal.classList.remove('ascuns');

    if (mesajTemporar) {
        actualizeazaTextStatus(mesajTemporar);
        setTimeout(() => {
            const textRevenire = (casetaPornita && casetaYoutube[indexPiesa]) 
                ? casetaYoutube[indexPiesa].titlu 
                : 'LINK';
            actualizeazaTextStatus(textRevenire);
        }, 2000);
    }
}

// Restrânge complet consola (butonul ↙)
function inchideStudioYoutube() {
    const banda = document.getElementById('zonaControlLista');
    inchideCasutaYoutube();
    if (banda) {
        banda.classList.remove('consola-deschisa');
    }
}

// Salvează melodia nouă la apăsarea tastei Enter
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
        let mesaj = 'Există deja în listă!';

        if (!existaDeja) {
            const titluReal = await aflaTitluYoutube(idExtras);
            const piesaNoua = { id: idExtras, titlu: titluReal };
            casetaYoutube.push(piesaNoua);

            // Salvare permanentă în memoria telefonului/browserului
            const listaLocala = JSON.parse(localStorage.getItem('sparky_playlist_extra') || '[]');
            listaLocala.push(piesaNoua);
            localStorage.setItem('sparky_playlist_extra', JSON.stringify(listaLocala));

            mesaj = 'Salvat: ' + titluReal;
        }

        inputLink.value = '';
        inputLink.disabled = false;
        inputLink.placeholder = 'Lipește link YouTube + Enter';
        inchideCasutaYoutube(mesaj);
    }
}

// Închide caseta de input dacă atingi în afara benzii
document.addEventListener('click', (e) => {
    const zonaControl = document.getElementById('zonaControlLista');
    const panouInput = document.getElementById('panouInputYoutube');
    if (zonaControl && panouInput && !zonaControl.contains(e.target) && !panouInput.classList.contains('ascuns')) {
        inchideCasutaYoutube();
    }
});

// ==========================================================
// 7. BUTONUL DE PORNIRE / OPRIRE PLAYLIST
// ==========================================================
async function comutaPlaylistInBanda() {
    if (blocareClickDupaCulis) return;
    const zonaVideo = document.getElementById('zonaVideoYoutube');
    const buton = document.getElementById('toggleYoutube');

    if (!zonaVideo || !buton) return;

    if (!casetaPornita) {
        if (window.innerWidth <= 750) {
            
           
        }
        zonaVideo.classList.add('activ');
        buton.classList.add('pornit');
        casetaPornita = true;

        await obtinePlaylist();
        if (casetaYoutube.length === 0) {
            actualizeazaTextStatus('Playlist gol!');
            return;
        }

        indexPiesa = Math.floor(Math.random() * casetaYoutube.length);
        pornestePiesaCuAPI(indexPiesa);
    } else {
        if (ytPlayer && typeof ytPlayer.destroy === 'function') {
            ytPlayer.destroy();
            ytPlayer = null;
        }
        zonaVideo.innerHTML = '';
        zonaVideo.classList.remove('activ');
        buton.classList.remove('pornit');
        document.body.classList.remove('video-sus-activ');
        casetaPornita = false;
        actualizeazaTextStatus('LINK');
    }
}

// ==========================================================
// 8. MOTORUL OFICIAL YT.PLAYER
// ==========================================================
function pornestePiesaCuAPI(index) {
    const zonaVideo = document.getElementById('zonaVideoYoutube');
    const piesa = casetaYoutube[index];
    if (!zonaVideo || !piesa || !casetaPornita) return;

    actualizeazaTextStatus(piesa.titlu);

    if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
        ytPlayer.loadVideoById(piesa.id);
        return;
    }

    zonaVideo.innerHTML = '<div id="ytPlayerBox"></div>';

    if (window.YT && window.YT.Player) {
        creeazaInstantaPlayer(piesa.id);
    } else {
        window.onYouTubeIframeAPIReady = () => {
            if (casetaPornita) creeazaInstantaPlayer(piesa.id);
        };
    }
}

function creeazaInstantaPlayer(videoId) {
    ytPlayer = new YT.Player('ytPlayerBox', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            autoplay: 1,
            playsinline: 1,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin
        },
        events: {
            onReady: (event) => {
                event.target.playVideo();
            },
            onStateChange: (event) => {
                if (event.data === 0) {
                    sariLaUrmatoarea();
                }
            },
            onError: () => {
                sariLaUrmatoarea();
            }
        }
    });
}

function sariLaUrmatoarea() {
    if (!casetaPornita || casetaYoutube.length === 0) return;
    indexPiesa = (indexPiesa + 1) % casetaYoutube.length;
    pornestePiesaCuAPI(indexPiesa);
}

// ==========================================================
// 9. A 3-A FUNCȚIE A BUTONULUI BARĂ: CULISARE LINIARĂ + HOP LA JUMĂTATE
// ==========================================================
let blocareClickDupaCulis = false;

(function initializeazaCulisButonBara() {
    const buton = document.getElementById('toggleYoutube');
    if (!buton) return;

    let startX = 0;
    let deplasareX = 0;
    let inTragere = false;
    let aTrecutDeHop = false;
    let aAtinsCapatul = false;

    const PRAG_HOP = -12;    // Jumătatea drumului („hop” tactil scurt)
    const PRAG_IESIRE = -24; // Capătul șinei (ieșire completă)
    const MAX_CULIS = -36;   // Limita maximă a șinei spre stânga

    function impulsMecanic(ms) {
        if ('vibrate' in navigator) {
            navigator.vibrate(ms);
        }
    }

    buton.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        startX = e.clientX;
        deplasareX = 0;
        inTragere = true;
        aTrecutDeHop = false;
        aAtinsCapatul = false;
        buton.classList.remove('revenire-elastica');
        buton.setPointerCapture(e.pointerId);
    });

    buton.addEventListener('pointermove', (e) => {
        if (!inTragere) return;
        const delta = e.clientX - startX;

        if (delta < 0) {
            deplasareX = Math.max(delta, MAX_CULIS);

            // Hop tactil la jumătatea drumului (-18px)
            if (deplasareX <= PRAG_HOP && !aTrecutDeHop) {
                aTrecutDeHop = true;
                impulsMecanic(25);
            } else if (deplasareX > PRAG_HOP && aTrecutDeHop) {
                aTrecutDeHop = false;
                impulsMecanic(20);
            }

            // Clic scurt la capăt (-38px)
            if (deplasareX <= PRAG_IESIRE && !aAtinsCapatul) {
                aAtinsCapatul = true;
                impulsMecanic(40);
            } else if (deplasareX > PRAG_IESIRE && aAtinsCapatul) {
                aAtinsCapatul = false;
            }

            // Mișcare strict liniară după deget
            buton.style.translate = `${deplasareX}px 0px`;
            buton.style.opacity = String(1 - Math.abs(deplasareX) / 95);
        } else {
            deplasareX = 0;
            buton.style.translate = '0px 0px';
            buton.style.opacity = '1';
        }
    });

    const finalizeazaCulis = (e) => {
        if (!inTragere) return;
        inTragere = false;

        if (buton.hasPointerCapture && buton.hasPointerCapture(e.pointerId)) {
            buton.releasePointerCapture(e.pointerId);
        }

        if (deplasareX < -10) {
            blocareClickDupaCulis = true;
            setTimeout(() => { blocareClickDupaCulis = false; }, 250);
        }

        if (deplasareX <= PRAG_IESIRE) {
            iesireCompletaLaLocatiaClasica();
        }

        buton.classList.add('revenire-elastica');
        buton.style.translate = '0px 0px';
        buton.style.opacity = '1';
        deplasareX = 0;
    };

    buton.addEventListener('pointerup', finalizeazaCulis);
    buton.addEventListener('pointercancel', finalizeazaCulis);
})();

function iesireCompletaLaLocatiaClasica() {
    const zonaVideo = document.getElementById('zonaVideoYoutube');
    const buton = document.getElementById('toggleYoutube');

    if (ytPlayer && typeof ytPlayer.destroy === 'function') {
        ytPlayer.destroy();
        ytPlayer = null;
    }
    if (zonaVideo) {
        zonaVideo.innerHTML = '';
        zonaVideo.classList.remove('activ');
    }
    if (buton) {
        buton.classList.remove('pornit');
    }

    document.body.classList.remove('video-sus-activ');
    casetaPornita = false;
    actualizeazaTextStatus('LINK');

    inchideStudioYoutube();
}


