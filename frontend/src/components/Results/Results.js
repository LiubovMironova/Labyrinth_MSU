import React, {Component} from 'react';
import {withRouter} from 'react-router';
import lodash from 'lodash';
import classes from './Results.module.css';
import Loader from '../../containers/Loader/Loader';
import {saveAs} from 'file-saver';

const Cookies = require('js-cookie');

class Results extends Component {
  constructor(props) {
    super(props);

    this.state = {
      type: 'expType',
      query: '',
      response: [],
      loading: false,
      error: false,
      category: Cookies.get('category'),
      sort: 'asc',
      sortField: 'pp',
      row: null,
      find: '',
      option: [],
    };
  }

  componentDidMount = async () => {
    await this.searchAll();
  };

  onSort = sortField => {
    const cloneData = this.state.response;
    const sortType = this.state.sort === 'asc' ? 'desc' : 'asc';
    const orderedData = lodash.orderBy(cloneData, sortField, sortType);
    this.setState({
      response: orderedData,
      sort: sortType,
      sortField,
    });
  };

  onSaveTxt = async id => {
    const response = await fetch('/experiment', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id}),
    });
    const results = await response.json();
    const {
      date, time, expName,
      expNumber, animalName, expType,
    } = results['0'];

    const elemFile = [
      `${date}\n`,
      `${time}\n`,
      `${results['0'].env.name}\n`,
      `${expName}\n`,
      `${expNumber}\n`,
      `${animalName}\n`,
      `${expType}\n`,
      `${results['0'].user.surname}\n`,
      `${results['0'].user.name}\n`,
      `${results['0'].user.age ? results['0'].user.age : '-'}\n`,
      `${results['0'].user.gender}\n`,
      `${results['0'].user.hand}\n`,
      `${results['0'].user.year ? results['0'].user.year : '-'}\n`,
      `${results['0'].user.group ? results['0'].user.group : '-'}\n`,
    ];


    let timeLine = [];
    if (results['0'].moves !== null) {
      results['0'].moves.forEach((elem) => {
        timeLine.push(`${Object.keys(elem)}:${Object.values(elem)}\n`);
      });
    }

    const newFile = [...elemFile, ...timeLine];

    const blob = await new Blob(newFile, {type: 'text/plain;charset=utf-8'});
    await saveAs(blob,
      `${results['0'].env.name}_${expType}_${expName}_${expNumber}_${animalName}`);

  };

  onDelete = async id => {
    if (this.state.category === 'Преподаватель') {
      const response = await fetch('/experiment', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id}),
      });
      const results = await response.json();
      this.setState({
        response: results,
      });
    }

  };

  searchAll = async () => {
    let response = await fetch('/experiment', {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
    });
    const result = await response.json();

    this.setState({
      loading: true, option: [
        'Тип эксперимента', 'Название эксперимента'],
    });

    if (result) {
      this.setState({loading: false, error: false, response: result});
    } else {
      this.setState({loading: false, error: true});
    }

  };

  changeType = async (e) => {
      if (e.target.value === 'Тип эксперимента') {
      this.setState({type: 'expType'});
      await this.search();
    } else if (e.target.value === 'Название эксперимента') {
      this.setState({type: 'expName'});
      await this.search();
    }
    await this.search();
  };

  changeQuery = async (e) => {
    await this.setState({query: e.target.value});
    await this.search();
  };

  search = async () => {
    const {type, query} = this.state;
    let resp = await fetch('/experiment/search', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type, query}),
    });
    const res = await resp.json();
    this.setState({loading: true});
    if (res.response) {
      this.setState({loading: false, error: false, response: res.response});
    } else {
      this.setState({loading: false, error: true});
    }
  };

  reset = async () => {
    this.setState({
      type: 'expType',
      query: '',
      response: [],
      loading: false,
      error: false,
      option: [],

    });
    await this.searchAll();
  };

  render() {
    const cls = [classes.Option];
    const any = [classes.Option, classes.enable];
    if (Cookies.get('category') === 'Преподаватель') {
      cls.push(classes.enable);
    } else {
      cls.push(classes.disable);
    }

    return this.state.response ? (
      <div>
        <div className={classes.Header}>
          <div><img src="/img/logo.png" alt="" className={classes.logo}/></div>
        </div>
        <div className={classes.LayoutRes}>
          <div className={'title'}><h1>Поиск</h1></div>
          <div className={classes.Header}>

            <select
              className={classes.selector}
              name="type"
              onChange={this.changeType}>
              {this.state.option.map((elem, index) => {
                return (
                  <option key={index}>
                    {elem}
                  </option>);
              })}
            </select>
            {
              this.state.type === 'expType' ?
                <input
                  className={classes.topInput}
                  value={this.state.query}
                  onChange={this.changeQuery}
                  placeholder={'введите тип эксперемента'}
                /> :
                this.state.type === 'expName' ?
                  <input
                    className={classes.topInput}
                    value={this.state.query}
                    onChange={this.changeQuery}
                    placeholder={'введите название эксперемента'}
                  /> :
                  null
            }
            <div
              className={classes.button}
              onClick={this.reset}
            >Сбросить
            </div>
          </div>
          <div className={classes.resTableDiv}>
            <table className={classes.resTable}>
              <thead>
              <tr>
                <th onClick={this.onSort.bind(this, 'date')}>Дата</th>
                <th onClick={this.onSort.bind(this, 'expType')}>Тип
                </th>
                <th onClick={this.onSort.bind(this, 'username')}>Пользователь
                </th>
                <th onClick={this.onSort.bind(this, 'expName')}>Эксперимент
                </th>
                <th onClick={this.onSort.bind(this, 'expNumber')}>Номер
                  опыта
                </th>
                <th onClick={this.onSort.bind(this, 'animalName')}>Имя
                  особи
                </th>
                <th colSpan="3">
                  Опции
                </th>
              </tr>
              </thead>
              <tbody>
              {this.state.response.map((result, index) => {
                return (
                      <tr className={classes.resResult} key={index} name={result._id}>
                        <td className={classes.resTd}>{result.date}</td>
                        <td className={classes.resTd}>{result.expType}</td>
                        <td className={classes.resTd}>{result.user ? result.user.username : null}</td>
                        <td className={classes.resTd}>{result.expName}</td>
                        <td className={classes.resTd}>{result.expNumber}</td>
                        <td className={classes.resTd}>{result.animalName}</td>
                        <td
                            className={any.join(' ')}
                            onClick={() => this.props.history.push(
                                '/results/' + result._id)}
                        >Смотреть
                        </td>
                        <td
                            className={any.join(' ')}
                            onClick={this.onSaveTxt.bind(this, result._id)}>Скачать
                        </td>
                        <td
                            className={cls.join(' ')}
                            onClick={this.onDelete.bind(this, result._id)}
                        >Удалить
                        </td>
                      </tr>
                );
              })
              }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ) : (<Loader/>);
  }
}

export default withRouter(Results);
