const { app, globalShortcut, clipboard, Menu, MenuItem, Notification, Tray } = require('electron');
const path = require('path');

let tray = null;

// Liste de noms propres à corriger
const nomsPropresCourants = [
    'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche',
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
    'europe', 'asie', 'afrique', 'amérique', 'océanie',
    'internet', 'web', 'facebook', 'twitter', 'instagram',
    'france', 'paris', 'lyon', 'marseille', 'bordeaux', 'lille', 'toulouse', 'nantes',
    'espagne', 'madrid', 'barcelone',
    'italie', 'rome', 'milan',
    'angleterre', 'londres',
    'allemagne', 'berlin',
    'belgique', 'bruxelles',
    'suisse', 'genève',
    'français', 'anglais', 'espagnol', 'italien', 'allemand', 'chinois', 'japonais',
    'américain', 'belge', 'suisse'
];

// Fonction pour corriger le texte avec l'IA
async function corrigerTexte(texte) {
    try {
        const corrections = {
            // Corrections courantes avec cédille et accents
            'ca': 'ça',
            'Ca': 'Ça',
            'comment ca': 'comment ça ?',
            'Comment ca': 'Comment ça ?',
            'ca va': 'ça va',
            'Ca va': 'Ça va',
            
            // Corrections SMS et réseaux sociaux
            'mdr': 'mort de rire',
            'ptdr': 'pété de rire',
            'lol': 'rires',
            'asap': 'dès que possible',
            'stp': 's\'il te plaît',
            'dsl': 'désolé',
            'bjr': 'bonjour',
            'cc': 'coucou',
            'oklm': 'au calme',
            
            // Corrections d'anglicismes courants
            'deadline': 'date limite',
            'meeting': 'réunion',
            'mail': 'courriel',
            'feedback': 'retour',
            
            // Corrections grammaticales
            'je suis pas': 'je ne suis pas',
            'il y as': 'il y a',
            'sa va': 'ça va',
            'c est': 'c\'est',
            'j ai': 'j\'ai',
            't es': 't\'es',
            'y a': 'il y a',
            'si j\'aurais': 'si j\'avais',
            'comme même': 'quand même',
            'au jour d\'aujourd\'hui': 'aujourd\'hui',
            'suite à': 'à la suite de',
            'par rapport que': 'parce que',
            'malgré que': 'bien que',
            
            // Abréviations courantes
            'ke': 'que',
            'koi': 'quoi',
            'pk': 'pourquoi',
            'tt': 'tout',
            'tjr': 'toujours',
            'ds': 'dans',
            'pr': 'pour',
            'pq': 'pourquoi',
            'qq': 'quelque',
            'qqn': 'quelqu\'un',
            'qqch': 'quelque chose',
            'rdv': 'rendez-vous',
            'pcq': 'parce que',
            'bcp': 'beaucoup',
            'qd': 'quand',
            'dc': 'donc',
            
            // Corrections d'accents
            'a coté': 'à côté',
            'a propos': 'à propos',
            'a partir': 'à partir',
            'deja': 'déjà',
            'tres': 'très',
            'apres': 'après',
            'voila': 'voilà',
            'la bas': 'là-bas',
            'la haut': 'là-haut',
            
            // Expressions familières
            'chui': 'je suis',
            'chai': 'je sais',
            'chais pas': 'je ne sais pas',
            'jsuis': 'je suis',
            'jsais': 'je sais',
            'jvais': 'je vais',
            'jpeux': 'je peux',
            'jdois': 'je dois',
            'genre': 'par exemple',
            'style': 'comme',
            'grave': 'beaucoup',
            'trop': 'très',
            
            // Questions courantes sans point d'interrogation
            'pourquoi ca': 'pourquoi ça ?',
            'Pourquoi ca': 'Pourquoi ça ?',
            'ou ca': 'où ça ?',
            'Ou ca': 'Où ça ?',
            'quand ca': 'quand ça ?',
            'Quand ca': 'Quand ça ?',
            'qui ca': 'qui ça ?',
            'Qui ca': 'Qui ça ?',
            'quel': 'quel ?',
            'Quel': 'Quel ?',
            'quoi': 'quoi ?',
            'Quoi': 'Quoi ?',
        };

        let texteCorrige = ' ' + texte + ' ';

        // Application des corrections de base
        for (const [incorrect, correct] of Object.entries(corrections)) {
            const safeIncorrect = incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            texteCorrige = texteCorrige.replace(new RegExp(`\\b${safeIncorrect}\\b`, 'gi'), (match) => {
                if (match === match.toUpperCase()) return correct.toUpperCase();
                if (match[0] === match[0].toUpperCase()) return correct[0].toUpperCase() + correct.slice(1);
                return correct;
            });
        }

        // Détection et correction des questions sans point d'interrogation
        texteCorrige = texteCorrige
            // Détection des questions directes
            .replace(/^(comment|pourquoi|où|quand|qui|quel|quoi|combien|lequel|laquelle|lesquels|lesquelles).*[^?!.]$/gim, '$&?')
            
            // Détection des questions avec inversion sujet-verbe
            .replace(/^.*-(tu|vous|je|il|elle|on|nous|ils|elles).*[^?!.]$/gim, '$&?')
            
            // Détection des questions avec "est-ce que"
            .replace(/^(est-ce que|qu'est-ce que).*[^?!.]$/gim, '$&?')
            
            // Détection des questions commençant par un verbe
            .replace(/^(peux|puis|sais|veux|dois|vas|fais|es|as)-(tu|vous).*[^?!.]$/gim, '$&?')
            
            // Détection des questions indirectes
            .replace(/^(sais-tu|savez-vous|peux-tu|pouvez-vous).*[^?!.]$/gim, '$&?');

        // Corrections typographiques
        texteCorrige = texteCorrige
            // Ponctuation
            .replace(/\s*([!?:;])/g, '\u202F$1')
            .replace(/([«])\s*/g, '$1\u202F')
            .replace(/\s*([»])/g, '\u202F$1')
            .replace(/\.\.\./g, '…')
            .replace(/\.{2,}/g, '…')
            .replace(/!{2,}/g, ' !')
            .replace(/\?{2,}/g, ' ?')
            
            // Guillemets
            .replace(/"([^"]+)"/g, '« $1 »')
            
            // Tirets et espaces
            .replace(/^-\s*/gm, '— ')
            .replace(/\s+-\s+/g, ' — ')
            
            // Espaces et ponctuations
            .replace(/\s+,/g, ',')
            .replace(/,(?!\s)/g, ', ')
            .replace(/\s+\./g, '.')
            .replace(/\.(?!\s|$)/g, '. ')
            .replace(/\s{2,}/g, ' ')
            
            // Parenthèses et crochets
            .replace(/\(\s+/g, '(')
            .replace(/\s+\)/g, ')')
            .replace(/\[\s+/g, '[')
            .replace(/\s+\]/g, ']')
            
            // Nettoyage final
            .trim();

        // Application des corrections pour les noms propres
        nomsPropresCourants.forEach(nom => {
            texteCorrige = texteCorrige.replace(
                new RegExp(`\\b${nom}\\b`, 'gi'),
                nom.charAt(0).toUpperCase() + nom.slice(1)
            );
        });

        return texteCorrige;
    } catch (error) {
        console.error('Erreur lors de la correction :', error);
        throw new Error('Erreur lors de la correction du texte');
    }
}

// Fonction pour afficher une notification
function showNotification(title, body) {
    if (Notification.isSupported()) {
        new Notification({ title, body }).show();
    }
}

// Fonction pour corriger et remplacer le texte
async function corrigerEtRemplacer(texte) {
    try {
        // Sauvegarde le texte original dans le presse-papiers
        const texteOriginal = clipboard.readText();
        
        // Corrige le texte
        const textCorrige = await corrigerTexte(texte);
        
        // Copie le texte corrigé
        clipboard.writeText(textCorrige);
        
        // Simule Ctrl+V pour coller
        require('child_process').execSync('powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^v\')"');
        
        // Restaure le presse-papiers original après un court délai
        setTimeout(() => {
            clipboard.writeText(texteOriginal);
        }, 100);
    } catch (error) {
        showNotification('Erreur', error.message);
    }
}

// Configuration du menu contextuel global
function setupContextMenu() {
    require('electron-context-menu')({
        prepend: () => [{
            label: 'Corriger le texte',
            click: async () => {
                // Simule Ctrl+C pour copier le texte sélectionné
                require('child_process').execSync('powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^c\')"');
                
                // Attend un très court instant pour la copie
                setTimeout(async () => {
                    const texteSelectionne = clipboard.readText();
                    if (texteSelectionne) {
                        await corrigerEtRemplacer(texteSelectionne);
                    }
                }, 50);
            }
        }]
    });
}

// Configuration du raccourci clavier
function setupKeyboardShortcut() {
    globalShortcut.register('CommandOrControl+Alt+C', async () => {
        // Simule Ctrl+C pour copier le texte sélectionné
        require('child_process').execSync('powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^c\')"');
        
        // Attend un très court instant pour la copie
        setTimeout(async () => {
            const texteSelectionne = clipboard.readText();
            if (texteSelectionne) {
                await corrigerEtRemplacer(texteSelectionne);
            }
        }, 50);
    });
}

// Configuration de l'icône dans la barre des tâches
function createTray() {
    try {
        tray = new Tray(path.join(__dirname, 'icon.png'));
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Correcteur de texte',
                enabled: false
            },
            { type: 'separator' },
            {
                label: 'Mode d\'emploi :',
                enabled: false
            },
            {
                label: '1. Sélectionnez le texte',
                enabled: false
            },
            {
                label: '2. Copiez-le (Ctrl+C)',
                enabled: false
            },
            {
                label: '3. Utilisez Ctrl+Alt+C',
                enabled: false
            },
            { type: 'separator' },
            {
                label: 'Quitter',
                click: () => app.quit()
            }
        ]);
        tray.setToolTip('Correcteur de texte - Ctrl+Alt+C');
        tray.setContextMenu(contextMenu);
    } catch (error) {
        console.error('Erreur lors de la création du tray:', error);
        showNotification('Erreur', 'Impossible de créer l\'icône dans la barre des tâches');
    }
}

// Initialisation de l'application
app.whenReady().then(() => {
    createTray();
    setupKeyboardShortcut();
    setupContextMenu();
    showNotification('Correcteur actif', 'Utilisez Ctrl+Alt+C ou le clic droit pour corriger un texte');
});

// Gestion de la fermeture
app.on('window-all-closed', () => {
    // Ne rien faire
});

app.on('before-quit', () => {
    globalShortcut.unregisterAll();
}); 