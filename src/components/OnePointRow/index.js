import React from 'react';
import ReactDOM from 'react-dom';
import s from './style.css';
import { mainStore } from '../../data/Stores';
import Dispatcher from '../../data/appDispatcher';
import keyMirror from 'fbjs/lib/keyMirror';
import updatePointsAndLinesOnMap from '../YandexMap/updatePointAndLinesOnMap'

const actions = keyMirror({
  REMOVE_ENTRY_POINT: null
});

Dispatcher.register((action) => {
  switch (action.type) {
    case actions.REMOVE_ENTRY_POINT:
      let prevArr = mainStore.Container.points;
      let arrWithoutElement = prevArr.filter((item, index) => {
        return index != action.id;
      });
      mainStore.Container.points = arrWithoutElement;

      // Теперь удаляем координату с таким же индексом из массива в котором храним координаты
      let prevCoordsArr = mainStore.YandexMap.coordsArr;
      let coordsArrWithoutDeletedCoord = prevCoordsArr.filter((item, index) => {
        return index != action.id;
      });

      mainStore.YandexMap.coordsArr = coordsArrWithoutDeletedCoord; // обновляем массив координат

      // Удаляем точку из коллекции геообъектов
      // mainStore.YandexMap.myGeoObjectCollectionForPoints.remove(mainStore.YandexMap.myGeoObjectCollectionForPoints.get(action.id));
      
      // Обнавляем точки и линии на карте
      updatePointsAndLinesOnMap();

      mainStore.setState('Container', mainStore.Container); // тут я весь объект переписываю. Наверное лучше будет если менять только одно свойство points. Ну пока так пусть побудет.
      break;
    default:
      return null;
  }
})

export default class OnePointRow extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.state = mainStore.OnePointRow;
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    Dispatcher.dispatch({
      type: 'REMOVE_ENTRY_POINT',
      id: this.props.id
    })
  }
  
  render() {
    const id = this.props.id;
    return (
      <div ref={this.myRef} className={`${s.rowContainer}`} id={id} data-about={'OnePointRow'}>
        <span className={`${s.noSelect}`}>{this.props.value} {this.props.id + 1}</span>
        <button className={s.button} onClick={this.handleClick}><span className={s.noSelect}>&#10005;</span></button>
      </div>
    )
  }

  componentDidMount() {
    console.log('component OnePointRow Did Mount');
    /* Наверное тут будет запуск функции добавления точек. Будем проходить по массиву mainStore.Component.points и каждую точку добавлять на Yandex Карту. 
    Наверное это будет реализовано через асинхронный map или что-то в этом духе. 

    А если много точек добавлено, например сто и две из них поменяли местами? Удалять все точки и заново их добавлять?
    Или может быть точки добавленные на карту хранить в отдельном массиве placedOnMapPoints и при каждом 
    обновлении массива mainStore.Component.points сравнивать эти два массива и удалять/добавлять только отличающиеся точки. 

    Пока сделаю простой вариант, потом подумаю как улучшить. 

    Через геоколлекции наверное лучше это делать. 
    */
  }
  componentWillUnmount() {
    // console.log('component OnePointRow Will Unmount');
  }
}