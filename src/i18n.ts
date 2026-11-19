export type Lang = 'tr' | 'de'

const tr = {
  'app.title': 'Bubu ve Dudu Mutfak',
  turn: 'Telefonu yan çevir',
  'meter.harmony': 'Uyum',
  'meter.chaos': 'Kaos',
  'lobby.title': 'Bubu & Dudu',
  'lobby.tagline': 'Aynı ev. İkiniz de toplar, ikiniz de pişirir.',
  'btn.host': 'Oda aç',
  'btn.opening': 'Açılıyor',
  'label.code': 'Oda kodu',
  'ph.code': '6 hane',
  'btn.join': 'Katıl',
  'host.title': 'Oda hazır',
  'host.share': 'Bu kodu diğer telefona yaz.',
  'btn.copy': 'Kodu kopyala',
  'copy.done': 'Kopyalandı',
  'copy.fail': 'Kodu elle seç',
  'host.wait': 'Partner bekleniyor.',
  'btn.cancel': 'Vazgeç',
  'join.title': 'Bağlanıyor',
  'join.body': 'Odaya bağlanılıyor.',
  'role.title': 'Rolünü seç',
  'role.body': 'İkiniz farklı bir ayı olun.',
  'btn.ready': 'Hazırım',
  'btn.readyDone': 'Hazırsın',
  'btn.leave': 'Odadan çık',
  'btn.again': 'Yeniden oyna',
  'down.title': 'Bağlantı koptu',
  'down.body': 'Yeni bir oda açıp kodu tekrar paylaşın.',
  'btn.newRoom': 'Yeni oda',
  'btn.swap': 'Değiştir',
  'btn.quit': 'Çık',
  'who.bubu': "Sen Bubu'sun",
  'who.dudu': "Sen Dudu'sun",
  'order.done': 'Servis bitti',
  'order.pancake': 'Çilekli pankek',
  'order.toast': 'Çay ve tost',
  'order.surprise': 'Sürpriz tabak',
  'order.pancakeAgain': 'Çilekli pankek, bir tur daha',
  'order.toastAgain': 'Çay ve tost, bir tur daha',
  'unit.sec': 'sn',
  'step.mix': 'Un, süt ve yumurtayı miksere koy.',
  'step.chopBerry': 'Çileği doğrama tahtasına götür.',
  'step.stoveBatter': 'Hamuru ocağa koy.',
  'step.platePancake': 'Pankek ve çileği tabaklayıp zile bas.',
  'step.chopBread': 'Ekmeği doğrama tahtasına götür.',
  'step.stoveBread': 'Ekmeği ocağa koy.',
  'step.kettle': 'Çayı demliğe koy.',
  'step.plateToast': 'Tost ve çayı tabaklayıp zile bas.',
  'step.plateSurprise': 'Pankek, çilek ve tostu tabaklayıp zile bas.',
  'verb.drop': 'Bırak',
  'verb.chop': 'Doğra',
  'verb.cook': 'Pişir',
  'verb.plate': 'Tabakla',
  'verb.mix': 'Karıştır',
  'verb.serve': 'Servis',
  'verb.wash': 'Yıka',
  'verb.take': 'Al',
  'verb.wait': 'Pişiyor',
  'verb.dash': 'Koş',
  'verb.ping': 'İşaretle',
  'status.waiting': 'Partnerin henüz rol seçmedi.',
  'status.ready': '{name} hazır.',
  'status.picked': '{name} seçildi, henüz hazır değil.',
  'notice.taken': 'Bu rol dolu. Diğerini seç.',
  'notice.pick': 'Önce bir rol seç.',
  'notice.reset': 'Yeni servis. Rolleri yeniden seçin.',
  'err.code': 'Kod 6 haneli olmalı.',
  'err.reopen': 'Yeni bir oda açıp kodu tekrar paylaşın.',
  'err.connect': 'Bağlantı kurulamadı. Yeniden dene.',
  'err.noRoom': 'Bu kodla açık bir oda yok. Arkadaşının oda ekranında beklediğinden emin ol.',
  'err.browser': 'Bu tarayıcı iki kişilik bağlantıyı açamıyor. Chrome veya Safari dene.',
  'err.signal': 'Sinyal sunucusuna ulaşılamadı. İnterneti kontrol edip yeniden dene.',
  'err.signalLate': 'Sinyal sunucusu yanıt vermedi. Biraz sonra yeniden dene.',
  'err.joinLate': 'Oda bulunamadı veya sunucu yanıt vermedi. Kodun açık olduğundan emin ol.',
  'station.stove': 'Ocak',
  'station.mixer': 'Mikser',
  'station.chop': 'Doğrama',
  'station.kettle': 'Çay',
  'station.sink': 'Lavabo',
  'station.plate': 'Tabak',
  'station.bell': 'Servis',
  'ending.uyumlu.title': 'Aynı ritim',
  'ending.uyumlu.text': 'Tabaklar zamanında gitti. Bubu yetiştirdi, Dudu yaktırmadı. Mutfak sakin kapandı.',
  'ending.kaos.title': 'Güzel bir karışıklık',
  'ending.kaos.text': 'Un uçtu, bir göz yandı, yine de zil çaldı. Bu mutfakta karışıklık da bir tür kahvaltı.',
  'ending.orta.title': 'Tam ikinize göre',
  'ending.orta.text': 'Kimi tabak tam kıvamında, kimi son anda yetişti. Servis ikinizin temposunda bitti.',
  'aria.move': 'Yürüyüş',
}

const de: Record<keyof typeof tr, string> = {
  'app.title': 'Bubu und Dudu Küche',
  turn: 'Dreh das Telefon quer',
  'meter.harmony': 'Einklang',
  'meter.chaos': 'Chaos',
  'lobby.title': 'Bubu & Dudu',
  'lobby.tagline': 'Dasselbe Haus. Ihr sammelt beide, ihr kocht beide.',
  'btn.host': 'Raum öffnen',
  'btn.opening': 'Öffnet',
  'label.code': 'Raumcode',
  'ph.code': '6 Ziffern',
  'btn.join': 'Beitreten',
  'host.title': 'Raum bereit',
  'host.share': 'Gib diesen Code auf dem anderen Telefon ein.',
  'btn.copy': 'Code kopieren',
  'copy.done': 'Kopiert',
  'copy.fail': 'Code selbst markieren',
  'host.wait': 'Partner wird erwartet.',
  'btn.cancel': 'Zurück',
  'join.title': 'Verbindung',
  'join.body': 'Der Raum wird verbunden.',
  'role.title': 'Wähl deine Rolle',
  'role.body': 'Ihr seid zwei verschiedene Bären.',
  'btn.ready': 'Ich bin bereit',
  'btn.readyDone': 'Du bist bereit',
  'btn.leave': 'Raum verlassen',
  'btn.again': 'Nochmal',
  'down.title': 'Verbindung weg',
  'down.body': 'Öffnet einen neuen Raum und teilt den Code noch einmal.',
  'btn.newRoom': 'Neuer Raum',
  'btn.swap': 'Tauschen',
  'btn.quit': 'Raus',
  'who.bubu': 'Du bist Bubu',
  'who.dudu': 'Du bist Dudu',
  'order.done': 'Service vorbei',
  'order.pancake': 'Erdbeerpfannkuchen',
  'order.toast': 'Tee und Toast',
  'order.surprise': 'Überraschungsteller',
  'order.pancakeAgain': 'Erdbeerpfannkuchen, noch eine Runde',
  'order.toastAgain': 'Tee und Toast, noch eine Runde',
  'unit.sec': 'Sek.',
  'step.mix': 'Mehl, Milch und Ei in den Mixer geben.',
  'step.chopBerry': 'Die Erdbeere zum Schneidebrett bringen.',
  'step.stoveBatter': 'Den Teig auf den Herd legen.',
  'step.platePancake': 'Pfannkuchen und Erdbeere anrichten, dann klingeln.',
  'step.chopBread': 'Das Brot zum Schneidebrett bringen.',
  'step.stoveBread': 'Das Brot auf den Herd legen.',
  'step.kettle': 'Den Tee in die Kanne geben.',
  'step.plateToast': 'Toast und Tee anrichten, dann klingeln.',
  'step.plateSurprise': 'Pfannkuchen, Erdbeere und Toast anrichten, dann klingeln.',
  'verb.drop': 'Ablegen',
  'verb.chop': 'Schneiden',
  'verb.cook': 'Kochen',
  'verb.plate': 'Anrichten',
  'verb.mix': 'Mixen',
  'verb.serve': 'Servieren',
  'verb.wash': 'Spülen',
  'verb.take': 'Nehmen',
  'verb.wait': 'Gart',
  'verb.dash': 'Rennen',
  'verb.ping': 'Zeigen',
  'status.waiting': 'Dein Partner hat noch keine Rolle gewählt.',
  'status.ready': '{name} ist bereit.',
  'status.picked': '{name} ist gewählt, aber noch nicht bereit.',
  'notice.taken': 'Diese Rolle ist belegt. Nimm die andere.',
  'notice.pick': 'Wähl zuerst eine Rolle.',
  'notice.reset': 'Neuer Service. Wählt die Rollen neu.',
  'err.code': 'Der Code braucht 6 Ziffern.',
  'err.reopen': 'Öffnet einen neuen Raum und teilt den Code noch einmal.',
  'err.connect': 'Verbindung fehlgeschlagen. Versuch es noch einmal.',
  'err.noRoom': 'Kein offener Raum mit diesem Code. Dein Freund muss auf dem Raum-Bildschirm warten.',
  'err.browser': 'Dieser Browser schafft die Verbindung zu zweit nicht. Versuch Chrome oder Safari.',
  'err.signal': 'Der Signalserver ist nicht erreichbar. Prüf das Internet und versuch es noch einmal.',
  'err.signalLate': 'Der Signalserver hat nicht geantwortet. Versuch es gleich noch einmal.',
  'err.joinLate': 'Raum nicht gefunden oder der Server hat nicht geantwortet. Der Code muss noch offen sein.',
  'station.stove': 'Herd',
  'station.mixer': 'Mixer',
  'station.chop': 'Schneidebrett',
  'station.kettle': 'Tee',
  'station.sink': 'Spüle',
  'station.plate': 'Teller',
  'station.bell': 'Klingel',
  'ending.uyumlu.title': 'Gleicher Takt',
  'ending.uyumlu.text': 'Die Teller kamen pünktlich. Bubu hat nachgelegt, Dudu hat nichts anbrennen lassen. Die Küche ging ruhig zu.',
  'ending.kaos.title': 'Ein schönes Durcheinander',
  'ending.kaos.text': 'Mehl flog, eine Platte brannte an, und die Glocke klingelte trotzdem. In dieser Küche ist Chaos auch eine Art Frühstück.',
  'ending.orta.title': 'Genau wie ihr zwei',
  'ending.orta.text': 'Mancher Teller war perfekt, mancher kam in letzter Sekunde. Der Service endete in eurem Tempo.',
  'aria.move': 'Laufen',
}

const tables = { tr, de }
const STORAGE = 'bubu-lang'

function storedLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE)
    if (saved === 'de' || saved === 'tr') return saved
  } catch {
    /* private mode */
  }
  return 'tr'
}

let lang: Lang = storedLang()

export function getLang(): Lang {
  return lang
}

export function setLang(next: Lang) {
  lang = next
  try {
    localStorage.setItem(STORAGE, next)
  } catch {
    /* ignore */
  }
}

export function t(key: string, vars?: Record<string, string>): string {
  if (!key) return ''
  const table = tables[lang]
  let text = table[key as keyof typeof tr] ?? tr[key as keyof typeof tr] ?? key
  if (vars) {
    for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, value)
  }
  return text
}

export function applyDom(root: ParentNode = document) {
  document.documentElement.lang = lang
  document.title = t('app.title')
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n ?? '')
  })
  root.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder ?? '')
  })
  root.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((node) => {
    node.setAttribute('aria-label', t(node.dataset.i18nAria ?? ''))
  })
  root.querySelectorAll<HTMLElement>('#lang button').forEach((button) => {
    button.classList.toggle('is-on', button.dataset.lang === lang)
  })
}

export function statusLine(code: string): string {
  if (!code) return ''
  if (code === 'status.waiting') return t(code)
  if (code.startsWith('status.ready.')) {
    return t('status.ready', { name: code.endsWith('bubu') ? 'Bubu' : 'Dudu' })
  }
  if (code.startsWith('status.picked.')) {
    return t('status.picked', { name: code.endsWith('bubu') ? 'Bubu' : 'Dudu' })
  }
  return t(code)
}
