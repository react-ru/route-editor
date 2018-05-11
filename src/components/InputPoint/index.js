import React from 'react';
import s from './style.css';
import {mainStore} from '../../data/Stores';
import Dispatcher from '../../data/appDispatcher';
import keyMirror from 'fbjs/lib/keyMirror';

const actions = keyMirror({
  ADD_ENTRY_POINT: null,
  DEL_ALL_POINTS: null,
  YANDEX_MAP_SET_CENTER: null,
});

Dispatcher.register((action) => {
  switch (action.type) {
    case actions.ADD_ENTRY_POINT:
      mainStore.Container.points.push(action.value);
      mainStore.setState('Container', mainStore.Container); // тут я весь объект переписываю. Наверное лучше будет если менять только одно свойство points. Ну пока так пусть побудет.
      break;
    case actions.DEL_ALL_POINTS:
      mainStore.Container.points = [];
      mainStore.YandexMap.coordsArr = [];
      mainStore.YandexMap.myGeoObjectCollectionForLines.removeAll();
      mainStore.YandexMap.myGeoObjectCollectionForPoints.removeAll();
      mainStore.setState('Container', mainStore.Container); // и тут я весь объект переписываю. Наверное лучше будет если менять только одно свойство points. Ну пока так пусть побудет.
      break;
    default:
      return null;
  }
})

export default class InputPoint extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.state = mainStore.InputPoint;
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') {
      let value = event.target.value;
      Dispatcher.dispatch({
        type: actions.ADD_ENTRY_POINT,
        value: value
      })
      this.addPointsAndLinesOnYandexMap(value);
      event.target.value = '';
    }
  }

  addPointsAndLinesOnYandexMap(value) {
    // Добавляем точку на карту
    mainStore.YandexMap.ymaps.ready(() => {
      mainStore.YandexMap.ymaps.geocode(value)
      .then(
        function (res) {
          if (res.geoObjects.get(0) !== null) {
            let coords = res.geoObjects.get(0).geometry.getCoordinates();
            return coords;
          } else {
            console.log('res.geoObjects.get(0) === 0', res.geoObjects.get(0));
          }
        },
        function (err) {
          console.log('ошибка в myGeocoder', err);
          // обработка ошибки
        }
      ).then(
        (coords)=>{
          mainStore.YandexMap.coordsArr.push(coords);
          // Создаем геообъект с типом геометрии "Точка".
          let myGeoObjectPoint = new ymaps.GeoObject({
            // Описание геометрии.
            geometry: {
              type: "Point",
              coordinates: coords
            },
            // Свойства.
            properties: {
              // Контент метки.
              iconContent: mainStore.Container.points.length,
              hintContent: 'hintContent'
            }
          }, {
              // Опции.
              // Иконка метки будет растягиваться под размер ее содержимого.
              preset: 'islands#blackStretchyIcon',
              // Метку можно перемещать.
              draggable: true
            })

          mainStore.YandexMap.myMap.setCenter(coords);

          // Очистить геоколлекцию линий перед добавлением новых линий
          if (mainStore.YandexMap.myGeoObjectCollectionForLines.getLength()) {
            mainStore.YandexMap.myGeoObjectCollectionForLines.removeAll()
          }

          // Добавить точки и линии в геоколекцию
          mainStore.YandexMap.myGeoObjectCollectionForLines.add(new ymaps.Polyline(mainStore.YandexMap.coordsArr, {}, { draggable: true }));
          mainStore.YandexMap.myGeoObjectCollectionForPoints.add(myGeoObjectPoint);

          // Добавить точки и линии на карту
          mainStore.YandexMap.myMap.geoObjects.add(mainStore.YandexMap.myGeoObjectCollectionForLines);
          mainStore.YandexMap.myMap.geoObjects.add(mainStore.YandexMap.myGeoObjectCollectionForPoints);

        },
        (err) => { console.log('ошибка', err); }
      )
    })

  }

  deleteAllPoints() {
    Dispatcher.dispatch({
      type: actions.DEL_ALL_POINTS
    })
  }

  render() {
    return (
      <label>
        <input type="text" id="InputPoint" className={s.main} defaultValue={''} onKeyPress={this.handleKeyPress.bind(this)} autoFocus ref={this.myRef} />
        <span className={s.delete} onClick={this.deleteAllPoints.bind(this)}>CLEAR</span>
      </label>
    )
  }
}


/* 
Мысли. Заметки. Идеи.

Алгоритм добавления точеки и соединяющих их линий. 

Добавляем поисковые запросы в массив points
После геокодирования получаем координаты.
Создаём геообъект "точка" с указанными координатами. 
Добавляем в массив "coords" координату данной точки. 
Добавляем точку на карту. 
Удаляем предыдущий объект "ломаная линия" с карты и создаем новый на основе массива координат "coords"
Добавляем на карту "ломаную линию".

Алгоритм удаления точки
Удаляем строковый запрос из массива points
Удаляем соответствующею ей координаты в массиве coords (по-идее у них должны быть одинаковые индексы)
Заново перерисовываем объекты "ломаная линия" на карте. Т.е. удаляем все старые и на основе обновленного списка координат 
создаем и добавляем на карту новые.
При замене местами в списке точек, делаем тоже самое. 

*/