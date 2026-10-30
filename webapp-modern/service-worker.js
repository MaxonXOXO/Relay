// Must be located at the root.
try {
  importScripts('https://cdn.jsdelivr.net/npm/firebase@13.1.0/firebase-app-compat.js');
  importScripts('https://cdn.jsdelivr.net/npm/firebase@13.1.0/firebase-messaging-compat.js');
  importScripts('firebase-init.js');
} catch (err) {
  console.warn('Firebase scripts unavailable in service worker:', err);
}
importScripts('version.js');

// Channel to notify the webapp. There is no BroadcastChannel in Safari.
const webAppChannel = (typeof BroadcastChannel == 'function') ?
  new BroadcastChannel('tinode-sw') : null;

// Basic internationalization.
const i18n = {
  'ar': {
    'new_message': "رسالة جديدة",
    'new_chat': "محادثة جديدة",
    'incoming_audio_call': "مكالمة صوتية واردة",
    'incoming_video_call': "مكالمة فيديو واردة",
    'missed_call': "مكالمة فائتة",
  },
  'de': {
    'new_message': "Neue Nachricht",
    'new_chat': "Neuer Chat",
    'incoming_audio_call': "Eingehender Sprachanruf",
    'incoming_video_call': "Eingehender Videoanruf",
    'missed_call': "Verpasster Anruf",
  },
  'en': {
    'new_message': "New message",
    'new_chat': "New chat",
    'incoming_audio_call': "Incoming Voice Call",
    'incoming_video_call': "Incoming Video Call",
    'missed_call': "Missed Call",
  },
  'fr': {
    'new_message': "Nouveau message",
    'new_chat': "Nouvelle conversation",
    'incoming_audio_call': "Appel vocal entrant",
    'incoming_video_call': "Appel vidéo entrant",
    'missed_call': "Appel manqué",
  },
  'id': {
    'new_message': "Pesan baru",
    'new_chat': "Chat baru",
    'incoming_audio_call': "Panggilan suara masuk",
    'incoming_video_call': "Panggilan video masuk",
    'missed_call': "Panggilan tak terjawab",
  },
  'es': {
    'new_message': "Nuevo mensaje",
    'new_chat': "Nueva conversación",
    'incoming_audio_call': "Llamada de voz entrante",
    'incoming_video_call': "Videollamada entrante",
    'missed_call': "Llamada perdida",
  },
  'it': {
    'new_message': "Nuovo Messaggio",
    'new_chat': "Nuova Chat",
    'incoming_audio_call': "Chiamata vocale in arrivo",
    'incoming_video_call': "Videochiamata in arrivo",
    'missed_call': "Chiamata persa",
  },
  'ko': {
    'new_message': "새로운 메시지",
    'new_chat': "새로운 채팅",
    'incoming_audio_call': "수신 음성 통화",
    'incoming_video_call': "수신 영상 통화",
    'missed_call': "부재중 전화",
  },
  'pt': {
    'new_message': "Nova Mensagem",
    'new_chat': "Nova Conversa",
    'incoming_audio_call': "Chamada de voz recebida",
    'incoming_video_call': "Videochamada recebida",
    'missed_call': "Chamada perdida",
  },
  'ro': {
    'new_message': "Mesaj nou",
    'new_chat': "Chat nou",
    'incoming_audio_call': "Apel vocal primit",
    'incoming_video_call': "Apel video primit",
    'missed_call': "Apel pierdut",
  },
  'ru': {
    'new_message': "Новое сообщение",
    'new_chat': "Новый чат",
    'incoming_audio_call': "Входящий аудиозвонок",
    'incoming_video_call': "Входящий видеозвонок",
    'missed_call': "Пропущенный звонок",
  },
  'th': {
    'new_message': "ข้อความใหม่",
    'new_chat': "แชทใหม่",
    'incoming_audio_call': "สายเรียกเข้า",
    'incoming_video_call': "วิดีโอคอลเรียกเข้า",
    'missed_call': "สายที่ไม่ได้รับ",
  },
  'uk': {
    'new_message': "Нове повідомлення",
    'new_chat': "Новий чат",
    'incoming_audio_call': "Вхідний аудіодзвінок",
    'incoming_video_call': "Вхідний відеодзвінок",
    'missed_call': "Пропущений дзвінок",
  },
  'vi': {
    'new_message': "Tin nhắn mới",
    'new_chat': "Cuộc trò chuyện mới",
    'incoming_audio_call': "Cuộc gọi thoại đến",
    'incoming_video_call': "Cuộc gọi video đến",
    'missed_call': "Cuộc gọi nhỡ",
  },
  'zh': {
    'new_message': "新讯息",
    'new_chat': "新聊天",
    'incoming_audio_call': "来电语音通话",
    'incoming_video_call': "来电视频通话",
    'missed_call': "未接来电",
  },
  'zh-TW': {
    'new_message': "新訊息",
    'new_chat': "新聊天",
    'incoming_audio_call': "來電語音通話",
    'incoming_video_call': "來電視訊通話",
    'missed_call': "未接來電",
  }
};

self.i18nMessage = function (id) {
  if (!id) {
    return null;
  }
  const lang = i18n[self.locale] || i18n[self.baseLocale] || i18n['en'];
  return lang[id] || i18n['en'][id] || id;
};

function showIncomingCallNotification(params) {
  const isAudio = !!params.audioOnly;
  const callTypeLabel = self.i18nMessage(isAudio ? 'incoming_audio_call' : 'incoming_video_call');
  const caller = params.callerName || 'Relay Contact';
  const title = `${caller} — ${callTypeLabel}`;
  const body = isAudio ? 'Tap to answer voice call on Relay' : 'Tap to answer video call on Relay';
  const options = {
    body: body,
    icon: params.avatar || '/img/logo192.png',
    badge: '/img/badge96.png',
    tag: 'relay-call-' + params.topic,
    renotify: true,
    requireInteraction: true,
    vibrate: [500, 250, 500, 250, 500, 250, 500, 250, 500, 250, 500],
    actions: [
      { action: 'answer', title: 'Answer' },
      { action: 'decline', title: 'Decline' }
    ],
    data: {
      topic: params.topic,
      seq: params.seq,
      isCall: true,
      audioOnly: isAudio
    }
  };
  return self.registration.showNotification(title, options);
}

function closeCallNotifications(topic) {
  const tag = topic ? ('relay-call-' + topic) : undefined;
  return self.registration.getNotifications(tag ? { tag } : {}).then(notifications => {
    notifications.forEach(n => {
      if (!tag || (n.tag && n.tag.startsWith('relay-call-'))) {
        n.close();
      }
    });
  });
}

if (typeof firebase !== 'undefined' && typeof FIREBASE_INIT !== 'undefined') {
  try {
    firebase.initializeApp(FIREBASE_INIT);
    const fbMessaging = firebase.messaging();

    // This method shows the push notifications while the window is in background.
    fbMessaging.onBackgroundMessage(payload => {
      const data = payload.data || {};
      // Notify webapp that a message was received.
      if (webAppChannel) {
        webAppChannel.postMessage(data);
      }

      // Handle WebRTC call push notifications even when marked silent="true" by the server.
      if (data.webrtc) {
        if (data.webrtc === 'started') {
          return showIncomingCallNotification({
            topic: data.topic,
            seq: Number(data.seq) || 0,
            callerName: data.title || 'Relay Contact',
            audioOnly: data.aonly === 'true'
          });
        } else {
          closeCallNotifications(data.topic);
          if (data.webrtc === 'missed') {
            return self.registration.showNotification(
              self.i18nMessage('missed_call'),
              {
                body: data.title || 'You missed a call on Relay',
                icon: '/img/logo96.png',
                badge: '/img/badge96.png',
                tag: 'relay-missed-' + data.topic,
                data: { topic: data.topic }
              }
            );
          }
          return;
        }
      }

      if (data.silent == 'true') {
        // No need to show anything.
        return;
      }

      const titles = { 'msg': 'new_message', 'sub': 'new_chat' };
      const pushType = data.what || 'msg';
      const title = data.title || self.i18nMessage(titles[pushType]);
      if (title) {
        const options = {
          body: data.content || '',
          icon: '/img/logo96.png',
          badge: '/img/badge96.png',
          tag: data.topic || undefined,
          renotify: true,
          vibrate: [200, 100, 200],
          data: {
            topic: data.topic
          }
        };
        return self.registration.showNotification(title, options);
      }
    });
  } catch (err) {
    console.warn('Firebase messaging init skipped in service worker:', err);
  }
}

// Update service worker immediately for both the current client
// and all other active clients.
self.addEventListener('install', _ => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key != PACKAGE_VERSION).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

// This code handles a click on notification: takes
// the user to the browser tab with the chat or opens a new tab.
self.addEventListener('notificationclick', event => {
  const data = event.notification.data;
  event.notification.close();
  if (!data) {
    return;
  }

  // Handle Decline button on an incoming call notification without opening window if already running.
  if (data.isCall && event.action === 'decline') {
    const msg = {
      type: 'call-action',
      action: 'decline',
      topic: data.topic,
      seq: data.seq
    };
    if (webAppChannel) {
      webAppChannel.postMessage(msg);
    }
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        windowClients.forEach(client => client.postMessage(msg));
      })
    );
    return;
  }

  const callAction = data.isCall ? (event.action === 'answer' ? 'answer' : 'show') : null;
  const urlHash = '#/' + data.topic + (callAction ? `?call_action=${callAction}&call_seq=${data.seq || ''}` : '');

  event.waitUntil(self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  })
    .then(windowClients => {
      const actionMsg = callAction ? {
        type: 'call-action',
        action: callAction,
        topic: data.topic,
        seq: data.seq
      } : null;

      if (actionMsg && webAppChannel) {
        webAppChannel.postMessage(actionMsg);
      }

      let anyClient = null;
      for (let i = 0; i < windowClients.length; i++) {
        const url = new URL(windowClients[i].url);
        if (actionMsg) {
          windowClients[i].postMessage(actionMsg);
        }
        if (url.hash.includes(data.topic)) {
          return windowClients[i].focus();
        } else {
          anyClient = windowClients[i];
        }
      }

      // Found tab with Relay on a different topic, navigate to the right topic.
      if (anyClient) {
        return anyClient.focus().then(thisClient => {
          if (!actionMsg) {
            const url = new URL(anyClient.url);
            url.hash = urlHash;
            return thisClient.navigate(url);
          }
          return thisClient;
        });
      }

      // Did not find a Relay browser tab. Open one.
      const url = new URL(self.location.origin);
      url.hash = urlHash;
      return clients.openWindow(url);
    }));
});

// This is needed for 'Add to Home Screen'.
self.addEventListener('fetch', event => {
  if (event.request.method != 'GET') {
    return;
  }

  // Bypass caching for the service worker file itself to prevent update loops.
  if (event.request.url.includes('service-worker.js')) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(PACKAGE_VERSION);
    const reqUrl = new URL(event.request.url);

    // Cache handling strategy: for navigation requests (index.html, index-dev.html)
    // and same-origin JS/CSS/HTML bundles use network-first strategy.
    if (event.request.mode == 'navigate' || (reqUrl.origin == self.location.origin && /\.(js|css|html)$/.test(reqUrl.pathname))) {
      // Network-First Strategy
      return fetchAndCache(event.request, cache, reqUrl)
        .catch(() => getFromCache(event.request, cache, reqUrl))
        .catch(() => new Response('Offline text fallback', { status: 503 }));
    } else {
      // Cache-First Strategy
      return getFromCache(event.request, cache, reqUrl)
        .catch(() => fetchAndCache(event.request, cache, reqUrl))
        .catch(() => new Response('', { status: 404 }));
    }
  })());
});

/**
 * Read from cache. Throw an error if item is missing (cache miss).
 */
async function getFromCache(request, cache, reqUrl) {
  // Using ignoreSearch=true to read cached attachments despite different auth signatures.
  const match = await cache.match(request, { ignoreSearch: (self.location.origin == reqUrl.origin) });
  if (!match) {
    throw new Error('Cache miss');
  }
  return match;
}

/**
 * Fetch from network and silently save copy to a specific cache bucket.
 */
async function fetchAndCache(request, cache, reqUrl) {
  const response = await fetch(request);
  if (!response || response.status != 200 || response.type != 'basic') {
    return response;
  }

  if (reqUrl && (reqUrl.protocol == 'http:' || reqUrl.protocol == 'https:')) {
    await cache.put(request, response.clone());
  }
  return response;
}

// Handle messages from the webapp (config, cache clear, incoming call & message alerts).
self.addEventListener('message', event => {
  if (!event.data) {
    return;
  }
  const data = (typeof event.data == 'string') ?
    JSON.parse(event.data) : event.data;

  if (data.type == 'clear-caches') {
    event.waitUntil(
      caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
    );
  } else if (data.type == 'config') {
    self.locale = data.locale || '';
    self.baseLocale = self.locale.toLowerCase().split(/[-_]/)[0];
  } else if (data.type == 'incoming-call') {
    event.waitUntil(showIncomingCallNotification(data));
  } else if (data.type == 'call-ended') {
    event.waitUntil(closeCallNotifications(data.topic));
  } else if (data.type == 'new-message') {
    const title = data.title || self.i18nMessage('new_message');
    event.waitUntil(
      self.registration.showNotification(title, {
        body: data.body || '',
        icon: data.avatar || '/img/logo96.png',
        badge: '/img/badge96.png',
        tag: data.topic || undefined,
        renotify: true,
        vibrate: [200, 100, 200],
        data: { topic: data.topic }
      })
    );
  }
});
