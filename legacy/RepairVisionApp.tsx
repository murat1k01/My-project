// @ts-nocheck
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView, View, Text, TouchableOpacity, ScrollView, Image,
  TextInput, StyleSheet, Alert, Platform, StatusBar, Linking, Modal, KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';

// ---------- Каталог устройств ----------
const DEVICES = [
  {
    id: 'iron', name: 'Утюг', icon: '👕',
    intro: 'Бытовой прибор для глажки. Основные узлы: подошва, термостат, бак с водой, паровой клапан.',
    tools: 'Отвёртка, лимонная кислота, мягкая ткань, мультиметр',
    safety: 'Всегда отключайте утюг от сети и дайте остыть 30 минут перед осмотром.',
    faults: [
      { title: 'Не нагревается', level: 'Средне', time: '20–40 мин',
        cause: 'Обрыв шнура, неисправный термостат или сработавший термопредохранитель.',
        steps: ['Отключите утюг от сети.', 'Осмотрите шнур и вилку: нет ли перегибов, оплавления.', 'Проверьте другую розетку.', 'Поверните регулятор температуры до максимума — слышен ли щелчок.', 'Прозвоните шнур и термостат мультиметром.', 'Замените неисправную деталь.'],
        master: 'Если шнур цел, а подошва холодная — термопредохранитель внутри корпуса, нужен специалист.' },
      { title: 'Течёт вода из подошвы', level: 'Легко', time: '10–15 мин',
        cause: 'Накипь в паровом клапане, переполненный бак или жёсткая вода.',
        steps: ['Дайте утюгу остыть и вылейте воду.', 'Заливайте воду не выше отметки MAX.', 'Включите функцию Self-Clean или промойте раствором лимонной кислоты.', 'Гладьте при температуре выше 150°C для режима пара.'],
        master: 'Если течёт и после очистки — повреждён уплотнитель бака, нужна замена.' },
      { title: 'Пятна на ткани', level: 'Легко', time: '10 мин',
        cause: 'Накипь или нагар на подошве.',
        steps: ['Остудите утюг.', 'Протрите подошву тканью с раствором соды.', 'Для нагара используйте специальный карандаш для утюга.', 'Не чистите подошву металлическими щётками.'],
        master: 'Не требуется. При глубоких царапинах подошву лучше заменить.' },
    ],
    parts: [
      { name: 'Бак для воды', x: 0.3, y: 0.3, info: 'Заливайте фильтрованную или дистиллированную воду. Накипь забивает клапан.' },
      { name: 'Термостат', x: 0.6, y: 0.5, info: 'Регулирует нагрев. При поломке утюг не греет или перегревается.' },
      { name: 'Подошва', x: 0.5, y: 0.75, info: 'Паровые отверстия нужно регулярно чистить от накипи.' },
      { name: 'Шнур питания', x: 0.85, y: 0.5, info: 'Самое частое место обрыва — у основания утюга.' },
    ],
  },
  {
    id: 'kettle', name: 'Чайник', icon: '🫖',
    intro: 'Электрический чайник: нагревательный элемент, термореле, подставка с контактами.',
    tools: 'Лимонная кислота, мягкая губка, отвёртка, мультиметр',
    safety: 'Не включайте чайник без воды и не погружайте подставку в воду.',
    faults: [
      { title: 'Не включается', level: 'Средне', time: '15–30 мин',
        cause: 'Загрязнены контакты, неисправна розетка или сработал термопредохранитель.',
        steps: ['Проверьте розетку другим прибором.', 'Плотно установите чайник на подставку.', 'Протрите контакты на подставке сухой тканью.', 'Осмотрите шнур подставки.', 'Если индикатор не горит — проверьте термореле.'],
        master: 'Если контакты чистые, а чайник мёртв — вероятно, сгорел термопредохранитель.' },
      { title: 'Накипь внутри', level: 'Легко', time: '40 мин',
        cause: 'Жёсткая вода, образование известкового налёта на элементе.',
        steps: ['Налейте воды и добавьте 1 ст. ложку лимонной кислоты на 1 л.', 'Вскипятите и оставьте на 30 минут.', 'Слейте раствор и прополощите чайник.', 'Повторите при сильной накипи.'],
        master: 'Не требуется.' },
      { title: 'Не выключается после закипания', level: 'Сложно', time: '1 ч',
        cause: 'Засорён паровой канал или вышел из строя биметаллический датчик.',
        steps: ['Отключите чайник от сети.', 'Прочистите паровой канал в крышке.', 'Проверьте плотность закрытия крышки.', 'При повторении — не пользуйтесь чайником.'],
        master: 'Неисправный датчик пара опасен, нужна замена в сервисе.' },
    ],
    parts: [
      { name: 'Нагревательный элемент', x: 0.5, y: 0.8, info: 'Закрытая спираль на дне. Покрывается накипью.' },
      { name: 'Контактная группа', x: 0.5, y: 0.92, info: 'Соединяет чайник с подставкой. Окисление ведёт к отказу включения.' },
      { name: 'Крышка с датчиком', x: 0.5, y: 0.15, info: 'Паровой датчик отключает чайник при закипании.' },
      { name: 'Ручка', x: 0.85, y: 0.5, info: 'Внутри ручки проходит проводка и кнопка включения.' },
    ],
  },
  {
    id: 'printer', name: 'Принтер', icon: '🖨️',
    intro: 'Струйный или лазерный принтер: лоток, ролики подачи, картридж, печатающая головка.',
    tools: 'Мягкая ткань, изопропиловый спирт, пинцет, свежая бумага',
    safety: 'Выключайте принтер перед извлечением бумаги. Не трогайте нагретый термоэлемент.',
    faults: [
      { title: 'Замятие бумаги', level: 'Легко', time: '10 мин',
        cause: 'Влажная или мятая бумага, изношенный ролик захвата, перегруженный лоток.',
        steps: ['Выключите принтер.', 'Откройте крышку и аккуратно вытяните бумагу по ходу движения.', 'Проверьте, не остались ли обрывки.', 'Загрузите ровную сухую бумагу, не более 80% лотка.'],
        master: 'Если замятия повторяются — замените ролик захвата.' },
      { title: 'Полосы при печати', level: 'Средне', time: '20 мин',
        cause: 'Засохли дюзы головки или заканчивается тонер/чернила.',
        steps: ['Проверьте уровень чернил или тонера.', 'Запустите чистку головки из меню принтера.', 'Распечатайте тест дюз.', 'Для лазерного принтера встряхните картридж.', 'Повторите чистку до трёх раз.'],
        master: 'Не помогает — головка засохла, нужна ручная промывка.' },
      { title: 'Принтер не виден компьютеру', level: 'Легко', time: '15 мин',
        cause: 'Повреждён кабель, не установлен драйвер или нет сети Wi-Fi.',
        steps: ['Перезагрузите принтер и компьютер.', 'Проверьте кабель USB или сеть Wi-Fi.', 'Переустановите драйвер с сайта производителя.', 'Выберите принтер по умолчанию.'],
        master: 'Не требуется.' },
    ],
    parts: [
      { name: 'Лоток подачи', x: 0.5, y: 0.2, info: 'Не перегружайте лоток и выравнивайте пачку бумаги.' },
      { name: 'Ролик захвата', x: 0.5, y: 0.45, info: 'Изношенный ролик — частая причина замятий.' },
      { name: 'Картридж', x: 0.5, y: 0.7, info: 'Проверьте уровень и контакты картриджа.' },
      { name: 'Панель управления', x: 0.85, y: 0.3, info: 'Здесь запускаются чистка головки и тест дюз.' },
    ],
  },
  {
    id: 'projector', name: 'Проектор', icon: '📽️',
    intro: 'Учебный проектор: лампа, объектив, система охлаждения, воздушный фильтр.',
    tools: 'Салфетка для оптики, кисточка, пылесос, отвёртка',
    safety: 'Дайте лампе остыть 20 минут. Не смотрите в объектив во время работы.',
    faults: [
      { title: 'Нет изображения', level: 'Легко', time: '10 мин',
        cause: 'Не выбран вход, плохой кабель или закрыта заглушка объектива.',
        steps: ['Снимите заглушку с объектива.', 'Проверьте кабель HDMI с обеих сторон.', 'Выберите нужный вход кнопкой Source.', 'Проверьте, не включён ли режим Blank.', 'Попробуйте другой источник сигнала.'],
        master: 'Если лампа не светится — вероятно, она выработала ресурс.' },
      { title: 'Перегрев и отключение', level: 'Средне', time: '30 мин',
        cause: 'Пыль в вентиляционных решётках и забитый фильтр.',
        steps: ['Выключите проектор и дайте остыть 20 минут.', 'Продуйте вентиляционные решётки.', 'Очистите воздушный фильтр.', 'Не закрывайте проектор вещами.'],
        master: 'Если шум кулера не пропал — нужна чистка внутренних вентиляторов.' },
      { title: 'Размытое изображение', level: 'Легко', time: '5 мин',
        cause: 'Не настроена резкость или загрязнён объектив.',
        steps: ['Поверните кольцо фокуса.', 'Протрите объектив салфеткой для оптики.', 'Выставьте проектор ровно относительно экрана.', 'Включите коррекцию трапеции.'],
        master: 'Не требуется.' },
    ],
    parts: [
      { name: 'Объектив', x: 0.3, y: 0.5, info: 'Протирайте только мягкой салфеткой для оптики.' },
      { name: 'Лампа', x: 0.6, y: 0.4, info: 'Ресурс 2000–5000 часов. Меняется через сервисный отсек.' },
      { name: 'Воздушный фильтр', x: 0.7, y: 0.7, info: 'Чистите раз в месяц, чтобы избежать перегрева.' },
      { name: 'Порты HDMI/VGA', x: 0.15, y: 0.8, info: 'Следите, чтобы кабель сидел плотно.' },
    ],
  },
  {
    id: 'laptop', name: 'Ноутбук', icon: '💻',
    intro: 'Портативный компьютер: аккумулятор, система охлаждения, разъём питания, SSD/HDD.',
    tools: 'Крестовая отвёртка, баллончик со сжатым воздухом, термопаста',
    safety: 'Выключите ноутбук и отсоедините зарядку перед вскрытием корпуса.',
    faults: [
      { title: 'Не заряжается', level: 'Средне', time: '20 мин',
        cause: 'Неисправен блок питания, изношен разъём или аккумулятор.',
        steps: ['Проверьте индикатор на блоке питания.', 'Осмотрите разъём на засорение и погнутые контакты.', 'Попробуйте другую розетку и удлинитель.', 'Проверьте состояние батареи в настройках системы.', 'Попробуйте другой совместимый блок питания.'],
        master: 'Расшатанный разъём требует перепайки в сервисе.' },
      { title: 'Сильно шумит и греется', level: 'Средне', time: '1–2 ч',
        cause: 'Пыль в системе охлаждения и высохшая термопаста.',
        steps: ['Закройте тяжёлые программы.', 'Поставьте ноутбук на ровную твёрдую поверхность.', 'Продуйте вентиляционные отверстия сжатым воздухом.', 'При опыте — разберите корпус, очистите кулер и замените термопасту.'],
        master: 'Если разборка вызывает сомнения — обратитесь в сервис.' },
      { title: 'Не включается', level: 'Сложно', time: '30+ мин',
        cause: 'Разряжен аккумулятор, сбой питания или неисправна плата.',
        steps: ['Подключите зарядку и подождите 15 минут.', 'Отсоедините всю периферию.', 'Зажмите кнопку питания на 30 секунд для сброса.', 'Проверьте, горят ли индикаторы.', 'Подключите к внешнему монитору.'],
        master: 'Если признаков жизни нет — неисправна материнская плата.' },
    ],
    parts: [
      { name: 'Кулер', x: 0.7, y: 0.3, info: 'Забивается пылью — отсюда шум и перегрев.' },
      { name: 'Разъём питания', x: 0.15, y: 0.6, info: 'Частая поломка — расшатанный разъём.' },
      { name: 'Аккумулятор', x: 0.5, y: 0.8, info: 'Со временем теряет ёмкость, срок службы 2–4 года.' },
      { name: 'SSD / HDD', x: 0.35, y: 0.5, info: 'Накопитель. Делайте резервные копии данных.' },
    ],
  },
];

// ---------- Мастера (ДЕМО: замените номера и имена на реальные) ----------
const MASTERS = [
  { id: 'm1', name: 'Алексей Н.', phone: '+77471543655', devices: ['iron', 'kettle'], exp: '8 лет', rating: 4.9, hours: '09:00–20:00',
    about: 'Мелкая бытовая техника: утюги, чайники, мультиварки. Выезд на дом.', price: 'Диагностика бесплатно, ремонт от 3 000' },
  { id: 'm2', name: 'Марина К.', phone: '+77471543655', devices: ['printer', 'projector'], exp: '6 лет', rating: 4.8, hours: '10:00–19:00',
    about: 'Офисная и учебная техника: принтеры, МФУ, проекторы. Заправка и чистка.', price: 'Диагностика 1 500, ремонт от 4 000' },
  { id: 'm3', name: 'Дмитрий С.', phone: '+77471543655', devices: ['laptop', 'projector', 'printer'], exp: '10 лет', rating: 4.7, hours: '11:00–21:00',
    about: 'Ноутбуки: чистка, замена термопасты, ремонт разъёмов питания, замена аккумуляторов.', price: 'Диагностика бесплатно, ремонт от 5 000' },
  { id: 'm4', name: 'Сервис «Мастер+»', phone: '+77471543655', devices: ['iron', 'kettle', 'printer', 'projector', 'laptop'], exp: '12 лет', rating: 4.6, hours: '09:00–18:00 (пн–сб)',
    about: 'Сервисный центр с гарантией на работы 3 месяца. Приём техники и выезд специалиста.', price: 'Диагностика бесплатно' },
];

const TABS = [
  ['diag', '🔍', 'Диагностика'],
  ['catalog', '📚', 'Каталог'],
  ['ar', '📷', 'Камера+'],
  ['history', '🕘', 'История'],
  ['masters', '👨‍🔧', 'Мастера'],
  ['request', '🛠️', 'Заявка'],
];

// ---------- Темы: светлая и тёмная, фиолетовый акцент ----------
const THEMES = {
  light: {
    bg: '#f6f3ff', surface: '#ffffff', text: '#1b1236', sub: '#5b5378', line: '#ddd3fb',
    primary: '#7c3aed', primaryDeep: '#5b21b6', soft: '#ede7ff', warnBg: '#fff4d6', warnText: '#8a4b00',
    danger: '#c026d3', shadow: '#7c3aed',
  },
  dark: {
    bg: '#0a0613', surface: '#16102a', text: '#f4f0ff', sub: '#b4a9d9', line: '#2d2354',
    primary: '#8b5cf6', primaryDeep: '#6d28d9', soft: '#1e1642', warnBg: '#2b2110', warnText: '#fbbf24',
    danger: '#e879f9', shadow: '#000000',
  },
};

const ThemeCtx = createContext({ t: THEMES.light, dark: false, toggle: () => {}, s: {} });
const useT = () => useContext(ThemeCtx).t;
const useS = () => useContext(ThemeCtx).s;

// ---------- Хранилище ----------
const load = async (key) => {
  try { return JSON.parse((await AsyncStorage.getItem(key)) || '[]'); } catch { return []; }
};
const save = (key, v) => AsyncStorage.setItem(key, JSON.stringify(v));

// ---------- Обёртка с темой ----------
export default function App() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('theme').then((v) => { if (v) setDark(v === 'dark'); }).catch(() => {});
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    AsyncStorage.setItem('theme', next ? 'dark' : 'light').catch(() => {});
  };
  const t = dark ? THEMES.dark : THEMES.light;
  const s = useMemo(() => makeStyles(t), [dark]);
  return (
    <ThemeCtx.Provider value={{ t, dark, toggle, s }}>
      <Main />
    </ThemeCtx.Provider>
  );
}

// ---------- Приложение ----------
function Main() {
  const { t, dark, toggle, s } = useContext(ThemeCtx);
  const [tab, setTab] = useState('diag');
  const [device, setDevice] = useState(DEVICES[0]);
  const [history, setHistory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [faultCtx, setFaultCtx] = useState(null);

  useEffect(() => {
    load('history').then(setHistory);
    load('requests').then(setRequests);
  }, []);

  const addHistory = async (item) => {
    const next = [item, ...history];
    setHistory(next); await save('history', next);
  };
  const removeHistory = async (id) => {
    const next = history.filter((h) => h.id !== id);
    setHistory(next); await save('history', next);
  };
  const addRequest = async (item) => {
    const next = [item, ...requests];
    setRequests(next); await save('requests', next);
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
      <View style={s.header}>
        <Text style={s.title}>Repair<Text style={{ color: t.primary }}>Vision</Text></Text>
        <TouchableOpacity onPress={toggle} style={s.themeBtn}>
          <Text style={{ fontSize: 18 }}>{dark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        {tab === 'diag' && <Diagnose device={device} setDevice={setDevice} onSave={addHistory} onFault={setFaultCtx} goMaster={() => setTab('masters')} />}
        {tab === 'catalog' && <Catalog onPick={(d) => { setDevice(d); setTab('diag'); }} />}
        {tab === 'ar' && <ARView device={device} setDevice={setDevice} />}
        {tab === 'masters' && <Masters device={device} setDevice={setDevice} fault={faultCtx} />}
        {tab === 'history' && <History items={history} onDelete={removeHistory} />}
        {tab === 'request' && <Request device={device} items={requests} onAdd={addRequest} />}
      </View>
      <View style={s.tabbar}>
        {TABS.map(([k, ic, label]) => (
          <TouchableOpacity key={k} style={s.tab} onPress={() => setTab(k)}>
            <View style={[s.tabIcon, tab === k && s.tabIconOn]}>
              <Text style={{ fontSize: 20 }}>{ic}</Text>
            </View>
            <Text style={[s.tabLabel, tab === k && s.tabActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ---------- Выбор устройства ----------
function DevicePicker({ device, onChange }) {
  const s = useS();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
      {DEVICES.map((d) => (
        <TouchableOpacity key={d.id} onPress={() => onChange(d)}
          style={[s.chip, device.id === d.id && s.chipOn]}>
          <Text style={device.id === d.id ? s.chipTextOn : s.chipText}>{d.icon} {d.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ---------- Диагностика ----------
function Diagnose({ device, setDevice, onSave, onFault, goMaster }) {
  const s = useS(); const t = useT();
  const [fault, setFault] = useState(null);
  const [media, setMedia] = useState(null);
  const [desc, setDesc] = useState('');
  const [done, setDone] = useState({});

  useEffect(() => { setFault(null); setDone({}); onFault(null); }, [device]);

  const pick = async (camera) => {
    const perm = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Нет доступа', 'Разрешите доступ в настройках.');
    const opts = { mediaTypes: ImagePicker.MediaType ? ['images', 'videos'] : ImagePicker.MediaTypeOptions.All, quality: 0.7, videoMaxDuration: 15 };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled) setMedia(res.assets[0]);
  };

  const saveCase = () => {
    if (!fault) return Alert.alert('Выберите неисправность');
    onSave({
      id: String(Date.now()), date: new Date().toLocaleString('ru-RU'),
      device: device.name, fault: fault.title, desc, mediaUri: media?.uri, mediaType: media?.type,
    });
    Alert.alert('Сохранено', 'Запись добавлена в историю ремонта.');
  };

  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Text style={s.h2}>1. Устройство</Text>
      <DevicePicker device={device} onChange={setDevice} />
      <View style={s.info}>
        <Text style={s.body}>{device.intro}</Text>
        <Text style={s.infoLine}>🧰 Инструменты: <Text style={s.body}>{device.tools}</Text></Text>
        <Text style={s.warn}>⚠️ {device.safety}</Text>
      </View>

      <Text style={s.h2}>2. Неисправность</Text>
      {device.faults.map((f) => (
        <TouchableOpacity key={f.title} onPress={() => { setFault(f); setDone({}); onFault(f); }}
          style={[s.card, fault?.title === f.title && s.cardOn]}>
          <Text style={s.cardText}>{f.title}</Text>
          <Text style={s.meta}>Сложность: {f.level} · Время: {f.time}</Text>
        </TouchableOpacity>
      ))}

      <Text style={s.h2}>3. Фото или видео дефекта</Text>
      <View style={s.row}>
        <Btn label="📸 Снять" onPress={() => pick(true)} />
        <Btn label="🖼️ Галерея" onPress={() => pick(false)} />
      </View>
      {media && (
        media.type === 'video'
          ? <Text style={s.note}>🎬 Видео прикреплено</Text>
          : <Image source={{ uri: media.uri }} style={s.preview} />
      )}

      <TextInput placeholderTextColor={t.sub} style={s.input} placeholder="Опишите проблему своими словами"
        value={desc} onChangeText={setDesc} multiline />

      {fault && (
        <>
          <Text style={s.h2}>4. Пошаговая инструкция</Text>
          <View style={s.info}>
            <Text style={s.infoLine}>🔎 Возможная причина:</Text>
            <Text style={s.body}>{fault.cause}</Text>
          </View>
          {fault.steps.map((st, i) => (
            <TouchableOpacity key={i} style={s.step} onPress={() => setDone({ ...done, [i]: !done[i] })}>
              <Text style={s.stepNum}>{done[i] ? '✅' : `${i + 1}.`}</Text>
              <Text style={[s.stepText, done[i] && { textDecorationLine: 'line-through', color: t.sub }]}>{st}</Text>
            </TouchableOpacity>
          ))}
          <View style={s.warnBox}>
            <Text style={s.warn}>👨‍🔧 Когда нужен специалист:</Text>
            <Text style={s.body}>{fault.master}</Text>
            <Btn label="📞 Связаться с мастером" onPress={goMaster} primary />
          </View>
        </>
      )}
      <Btn label="💾 Сохранить в историю" onPress={saveCase} primary />
    </ScrollView>
  );
}

// ---------- Каталог ----------
function Catalog({ onPick }) {
  const s = useS();
  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Text style={s.h2}>Каталог устройств</Text>
      {DEVICES.map((d) => (
        <TouchableOpacity key={d.id} style={s.card} onPress={() => onPick(d)}>
          <Text style={s.cardText}>{d.icon}  {d.name}</Text>
          <Text style={s.body}>{d.intro}</Text>
          <Text style={s.meta}>Неисправностей: {d.faults.length} · Деталей: {d.parts.length}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ---------- Камера с подписями поверх изображения ----------
function ARView({ device, setDevice }) {
  const s = useS();
  const [perm, requestPerm] = useCameraPermissions();
  const [active, setActive] = useState(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  if (!perm) return <View />;
  if (!perm.granted) {
    return (
      <View style={[s.pad, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
        <Text style={s.note}>Для режима «Камера+» нужен доступ к камере.</Text>
        <Btn label="Разрешить" onPress={requestPerm} primary />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 12 }}><DevicePicker device={device} onChange={(d) => { setDevice(d); setActive(null); }} /></View>
      <View style={{ flex: 1 }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
        {device.parts.map((p) => (
          <TouchableOpacity key={p.name} onPress={() => setActive(p)}
            style={[s.hotspot, { left: p.x * size.w - 14, top: p.y * size.h - 14 }]}>
            <View style={s.dot} />
            <Text style={s.hotLabel}>{p.name}</Text>
          </TouchableOpacity>
        ))}
        {active && (
          <View style={s.bubble}>
            <Text style={s.bubbleTitle}>{active.name}</Text>
            <Text style={s.bubbleText}>{active.info}</Text>
            <TouchableOpacity onPress={() => setActive(null)}><Text style={s.close}>Закрыть</Text></TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ---------- История ----------
function History({ items, onDelete }) {
  const s = useS();
  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Text style={s.h2}>История ремонта</Text>
      {items.length === 0 && <Text style={s.note}>Пока пусто. Сохраните первый случай во вкладке «Диагностика».</Text>}
      {items.map((h) => (
        <View key={h.id} style={s.card}>
          <Text style={s.cardText}>{h.device}: {h.fault}</Text>
          <Text style={s.note}>{h.date}</Text>
          {!!h.desc && <Text style={[s.body, { marginTop: 4 }]}>{h.desc}</Text>}
          {h.mediaUri && h.mediaType !== 'video' && <Image source={{ uri: h.mediaUri }} style={s.preview} />}
          {h.mediaType === 'video' && <Text style={s.note}>🎬 Видео</Text>}
          <TouchableOpacity onPress={() => onDelete(h.id)}><Text style={s.del}>Удалить</Text></TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

// ---------- Заявка ----------
function Request({ device, items, onAdd }) {
  const s = useS(); const t = useT();
  const [kind, setKind] = useState('part');
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState(0);
  const [part, setPart] = useState('');
  const [contact, setContact] = useState('');

  const submit = () => {
    if (!contact.trim()) return Alert.alert('Укажите контакт для связи');
    onAdd({
      id: String(Date.now()), date: new Date().toLocaleString('ru-RU'),
      kind, device: device.name, part, contact,
      pay: months && amount ? `Рассрочка 0·0·${months}: ${Math.ceil((parseInt(amount.replace(/\D/g, ''), 10) || 0) / months)} в мес. × ${months}` : 'Оплата сразу',
    });
    setPart(''); setContact(''); setAmount(''); setMonths(0);
    Alert.alert('Заявка отправлена', 'Сохранена локально (демо-режим).');
  };

  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Text style={s.h2}>Заявка · {device.icon} {device.name}</Text>
      <OfferCard amount={amount} setAmount={setAmount} months={months} setMonths={setMonths} />
      <View style={s.row}>
        <Btn label="Запчасть" onPress={() => setKind('part')} primary={kind === 'part'} />
        <Btn label="Специалист" onPress={() => setKind('master')} primary={kind === 'master'} />
      </View>
      {kind === 'part' && (
        <TextInput placeholderTextColor={t.sub} style={s.input} placeholder="Какая деталь нужна?" value={part} onChangeText={setPart} />
      )}
      <TextInput placeholderTextColor={t.sub} style={s.input} placeholder="Телефон или e-mail" value={contact} onChangeText={setContact} />
      <Btn label="Отправить заявку" onPress={submit} primary />

      <Text style={s.h2}>Мои заявки</Text>
      {items.length === 0 && <Text style={s.note}>Заявок пока нет.</Text>}
      {items.map((r) => (
        <View key={r.id} style={s.card}>
          <Text style={s.cardText}>{r.kind === 'part' ? '🔩 Запчасть' : '👨‍🔧 Специалист'} · {r.device}</Text>
          {!!r.part && <Text style={s.body}>{r.part}</Text>}
          {!!r.pay && <Text style={s.meta}>💳 {r.pay}</Text>}
          <Text style={s.note}>{r.date} · {r.contact}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ---------- Связь с мастером ----------
function Masters({ device, setDevice, fault }) {
  const s = useS();
  const [filter, setFilter] = useState(device.id);
  const [chat, setChat] = useState(null);
  useEffect(() => setFilter(device.id), [device]);

  const list = MASTERS.filter((m) => filter === 'all' || m.devices.includes(filter));
  const intro = `Здравствуйте! Нужна помощь с устройством: ${device.name}.` + (fault ? ` Неисправность: ${fault.title}.` : '');

  const call = (m) => Linking.openURL(`tel:${m.phone}`).catch(() => Alert.alert('Не удалось набрать номер'));
  const wa = (m) =>
    Linking.openURL(`https://wa.me/${m.phone.replace('+', '')}?text=${encodeURIComponent(intro)}`)
      .catch(() => Alert.alert('Не удалось открыть WhatsApp'));

  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Text style={s.h2}>Связь с мастером</Text>
      <View style={s.info}>
        <Text style={s.body}>Ваше обращение: {device.icon} {device.name}{fault ? ` — ${fault.title}` : ''}.</Text>
        <Text style={s.meta}>Это сообщение подставится в чат и WhatsApp автоматически.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
        <TouchableOpacity onPress={() => setFilter('all')} style={[s.chip, filter === 'all' && s.chipOn]}>
          <Text style={filter === 'all' ? s.chipTextOn : s.chipText}>Все</Text>
        </TouchableOpacity>
        {DEVICES.map((d) => (
          <TouchableOpacity key={d.id} onPress={() => { setFilter(d.id); setDevice(d); }} style={[s.chip, filter === d.id && s.chipOn]}>
            <Text style={filter === d.id ? s.chipTextOn : s.chipText}>{d.icon} {d.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {list.map((m) => (
        <View key={m.id} style={s.card}>
          <Text style={s.cardText}>{m.name}  ⭐ {m.rating}</Text>
          <Text style={s.meta}>Опыт: {m.exp} · Работает: {m.hours}</Text>
          <Text style={[s.body, { marginTop: 6 }]}>{m.about}</Text>
          <Text style={s.meta}>💰 {m.price}</Text>
          <Text style={s.meta}>Специализация: {m.devices.map((id) => DEVICES.find((d) => d.id === id).icon).join(' ')}</Text>
          <View style={s.row}>
            <Btn label="📞 Позвонить" onPress={() => call(m)} primary />
            <Btn label="💬 WhatsApp" onPress={() => wa(m)} />
          </View>
          <Btn label="✉️ Написать в чат" onPress={() => setChat(m)} />
        </View>
      ))}
      {list.length === 0 && <Text style={s.note}>Мастеров по этому устройству пока нет.</Text>}

      {chat && <Chat master={chat} intro={intro} onClose={() => setChat(null)} />}
    </ScrollView>
  );
}

function Chat({ master, intro, onClose }) {
  const s = useS(); const t = useT();
  const key = 'chat_' + master.id;
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState(intro);
  const ref = useRef([]);
  const scroll = useRef(null);

  useEffect(() => { load(key).then((m) => { ref.current = m; setMsgs(m); }); }, []);

  const push = (m) => {
    ref.current = [...ref.current, m];
    setMsgs(ref.current);
    save(key, ref.current);
  };
  const now = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const send = () => {
    if (!text.trim()) return;
    push({ id: String(Date.now()), from: 'me', text: text.trim(), time: now() });
    setText('');
    // ДЕМО-ответ. Для реального чата подключите сервер (Firebase, Supabase и т.д.)
    setTimeout(() => push({
      id: String(Date.now() + 1), from: 'master', time: now(),
      text: 'Спасибо за обращение! Я посмотрел описание. Пришлите, пожалуйста, фото неисправности — отвечу в течение 15 минут. (демо-ответ)',
    }), 1500);
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.root}>
        <View style={s.chatHead}>
          <TouchableOpacity onPress={onClose}><Text style={s.chatBack}>← Назад</Text></TouchableOpacity>
          <Text style={s.chatTitle}>{master.name}</Text>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView ref={scroll} contentContainerStyle={s.pad} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
            {msgs.length === 0 && <Text style={s.note}>Сообщений пока нет. Отправьте первое — текст уже подставлен ниже.</Text>}
            {msgs.map((m) => (
              <View key={m.id} style={[s.bubbleMsg, m.from === 'me' ? s.me : s.them]}>
                <Text style={m.from === 'me' ? s.meText : s.themText}>{m.text}</Text>
                <Text style={m.from === 'me' ? s.meTime : s.themTime}>{m.time}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={s.chatInputRow}>
            <TextInput style={[s.input, { flex: 1, marginTop: 0 }]} value={text} onChangeText={setText}
              placeholder="Сообщение мастеру" placeholderTextColor={t.sub} multiline />
            <TouchableOpacity style={s.sendBtn} onPress={send}><Text style={s.sendText}>➤</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ---------- Предложение: оплата частями ----------
function OfferCard({ amount, setAmount, months, setMonths }) {
  const s = useS(); const t = useT();
  const sum = parseInt(amount.replace(/\D/g, ''), 10) || 0;
  const monthly = months && sum ? Math.ceil(sum / months) : 0;
  const plans = [[0, 'Сразу'], [3, '3 мес'], [6, '6 мес'], [12, '12 мес']];
  return (
    <View style={s.offer}>
      <Text style={s.offerTag}>СПЕЦПРЕДЛОЖЕНИЕ</Text>
      <Text style={s.offerTitle}>Ремонт в рассрочку 0·0·12</Text>
      <Text style={s.offerText}>Оплачивайте запчасти и работу мастера частями — без переплаты и первоначального взноса.</Text>
      <TextInput style={s.input} placeholder="Сумма ремонта" placeholderTextColor={t.sub}
        keyboardType="numeric" value={amount} onChangeText={setAmount} />
      <View style={s.offerPlans}>
        {plans.map(([m, label]) => (
          <TouchableOpacity key={m} onPress={() => setMonths(m)} style={[s.planChip, months === m && s.planOn]}>
            <Text style={[s.planText, months === m && { color: '#5b21b6' }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {monthly > 0 && (
        <Text style={s.offerSum}>{monthly.toLocaleString('ru-RU')} в месяц × {months} мес.</Text>
      )}
      <Text style={s.offerSmall}>🎁 Промокод FIRST5 — скидка 5% на первую заявку. Демо-предложение: реальная рассрочка требует подключения платёжного партнёра.</Text>
    </View>
  );
}

// ---------- UI ----------
const Btn = ({ label, onPress, primary }) => {
  const s = useS();
  return (
    <TouchableOpacity onPress={onPress} style={[s.btn, primary && s.btnPrimary]}>
      <Text style={[s.btnText, primary && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const makeStyles = (t) => StyleSheet.create({
  root: { flex: 1, backgroundColor: t.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 26, fontWeight: '800', color: t.text, letterSpacing: 0.3 },
  themeBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: t.surface, borderWidth: 1.5, borderColor: t.primary, alignItems: 'center', justifyContent: 'center' },
  pad: { padding: 14, paddingBottom: 40 },
  h2: { fontSize: 19, fontWeight: '800', marginTop: 16, marginBottom: 8, color: t.text },
  body: { fontSize: 16, lineHeight: 23, color: t.text, fontWeight: '400' },
  meta: { fontSize: 14, color: t.sub, marginTop: 4, fontWeight: '600' },
  note: { fontSize: 15, color: t.sub, marginTop: 4 },
  tabbar: { flexDirection: 'row', backgroundColor: t.surface, borderTopWidth: 1, borderColor: t.line, paddingBottom: 8, paddingTop: 4 },
  tab: { flex: 1, alignItems: 'center', paddingTop: 4 },
  tabIcon: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 14 },
  tabIconOn: { backgroundColor: t.soft },
  tabLabel: { fontSize: 11, color: t.sub, fontWeight: '600', marginTop: 2 },
  tabActive: { color: t.primary, fontWeight: '800' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: t.surface, borderRadius: 22, marginRight: 8, borderWidth: 1.5, borderColor: t.line },
  chipOn: { backgroundColor: t.primary, borderColor: t.primary },
  chipText: { color: t.text, fontSize: 16, fontWeight: '700' },
  chipTextOn: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: t.surface, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: t.line, shadowColor: t.shadow, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  cardOn: { borderColor: t.primary, borderWidth: 2.5 },
  cardText: { fontSize: 18, fontWeight: '700', color: t.text },
  info: { backgroundColor: t.soft, borderRadius: 16, padding: 14, marginBottom: 6, borderLeftWidth: 4, borderLeftColor: t.primary },
  infoLine: { fontSize: 16, fontWeight: '700', color: t.text, marginTop: 6, lineHeight: 23 },
  warn: { fontSize: 16, fontWeight: '700', color: t.warnText, marginTop: 8, lineHeight: 23 },
  warnBox: { backgroundColor: t.warnBg, borderRadius: 16, padding: 14, marginTop: 6 },
  row: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, backgroundColor: t.surface, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: t.primary, marginTop: 8 },
  btnPrimary: { backgroundColor: t.primary, borderColor: t.primary },
  btnText: { fontWeight: '800', fontSize: 16, color: t.primary },
  input: { backgroundColor: t.surface, borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1.5, borderColor: t.line, minHeight: 48, fontSize: 16, color: t.text },
  preview: { width: '100%', height: 200, borderRadius: 12, marginTop: 8 },
  step: { flexDirection: 'row', backgroundColor: t.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: t.line },
  stepNum: { width: 34, fontWeight: '800', fontSize: 16, color: t.primary },
  stepText: { flex: 1, fontSize: 16, lineHeight: 23, color: t.text },
  del: { color: t.danger, marginTop: 10, fontWeight: '800', fontSize: 15 },
  hotspot: { position: 'absolute', alignItems: 'center' },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(124,58,237,0.9)', borderWidth: 2, borderColor: '#ffffff' },
  hotLabel: { color: '#ffffff', backgroundColor: 'rgba(20,10,40,0.85)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 3, fontSize: 14, fontWeight: '700' },
  bubble: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: t.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: t.line },
  bubbleTitle: { fontWeight: '800', fontSize: 19, marginBottom: 6, color: t.text },
  bubbleText: { fontSize: 16, lineHeight: 23, color: t.text },
  close: { color: t.primary, fontWeight: '800', fontSize: 16, marginTop: 10, textAlign: 'right' },
  chatHead: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: t.primaryDeep },
  chatBack: { color: '#ffffff', fontSize: 17, fontWeight: '700', marginRight: 16 },
  chatTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  bubbleMsg: { maxWidth: '82%', borderRadius: 16, padding: 12, marginBottom: 8 },
  me: { alignSelf: 'flex-end', backgroundColor: t.primary },
  them: { alignSelf: 'flex-start', backgroundColor: t.surface, borderWidth: 1, borderColor: t.line },
  meText: { color: '#ffffff', fontSize: 16, lineHeight: 22 },
  themText: { color: t.text, fontSize: 16, lineHeight: 22 },
  meTime: { color: '#e4d9ff', fontSize: 12, marginTop: 4, textAlign: 'right' },
  themTime: { color: t.sub, fontSize: 12, marginTop: 4 },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, backgroundColor: t.surface, borderTopWidth: 1, borderColor: t.line },
  sendBtn: { backgroundColor: t.primary, borderRadius: 24, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  offer: { backgroundColor: t.primaryDeep, borderRadius: 20, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: t.primary },
  offerTag: { color: '#e4d9ff', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  offerTitle: { color: '#ffffff', fontSize: 24, fontWeight: '800', marginTop: 4 },
  offerText: { color: '#ffffff', fontSize: 16, lineHeight: 23, marginTop: 6 },
  offerPlans: { flexDirection: 'row', gap: 8, marginTop: 12 },
  planChip: { flex: 1, borderWidth: 2, borderColor: '#ffffff', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  planOn: { backgroundColor: '#ffffff' },
  planText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  offerSum: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginTop: 12 },
  offerSmall: { color: '#e4d9ff', fontSize: 13, lineHeight: 18, marginTop: 10 },
});