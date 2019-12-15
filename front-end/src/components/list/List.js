import React from 'react';
import { handleResponse } from '../../Helper';
import { API_URL } from '../../config';
import Loading from '../common/Loading';
import Table from './Table';
import Pagination from './Pagination';

class List extends React.Component {
  constructor(){
    super();
    this.state = {
      loading: false,
      days: [],
      error: null,
      page: 1,
      totalPages: 1,
    };
    this.handlePaginationClick = this.handlePaginationClick.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }
    
  fetchData() {
    this.setState({ loading: true });
    const { page } = this.state;
    fetch(`${API_URL}/tweets?page=${page}`)
      .then(handleResponse)
      .then((data) => {
        this.setState({
          days: data.days,
          totalPages: data.totalPages,
          loading: false,
        });
      })
      .catch((error) => {
        this.setState({
          error: error.errorMassage,
          loading: false,
        });
      });
  }

  handlePaginationClick(direction,){
    let nextPage = this.state.page;     
    // increment nextPage if direction is 'next', otherwise decrement it
    nextPage = direction === 'next' ? nextPage + 1 : nextPage - 1;
    this.setState({ page: nextPage }, () => {
      this.fetchData();
    });
  }

  render() {
    const { loading, error, days, totalPages, page } = this.state;
    // render only loading component, if loading state is set to true
    if (loading) {
      return <div className="loading-container"><Loading /></div>
    }
    // render only error message, if error occurred while fetching data
    if (error){
      return <div className="error">{error}</div>
    }
    return (
      <div>
        <Table
          days={days} 
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          handlePaginationClick={this.handlePaginationClick}
        />
      </div>
    );
  }
}

export default List;
