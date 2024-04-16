import React from 'react';
import Table from '../../../components/Table';
import { uriConsumerGroups, uriConsumerGroupDelete } from '../../../utils/endpoints';
import constants from '../../../utils/constants';
import { calculateTopicOffsetLag, groupedTopicOffset } from '../../../utils/converters';
import Header from '../../Header';
import SearchBar from '../../../components/SearchBar';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/Modal/ConfirmModal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Root from '../../../components/Root';
import { Link } from 'react-router-dom';
import { handlePageChange, getPageNumber } from './../../../utils/pagination';
import { withRouter } from '../../../utils/withRouter';

class ConsumerGroupList extends Root {
  state = {
    consumerGroups: [],
    showDeleteModal: false,
    selectedCluster: '',
    deleteMessage: '',
    groupToDelete: {},
    deleteData: {},
    pageNumber: 1,
    totalPageNumber: 1,
    search: '',
    roles: JSON.parse(sessionStorage.getItem('roles')),
    loading: true
  };

  componentDidMount() {
    const { clusterId } = this.props.params;
    const { search, pageNumber } = this.state;
    const query = new URLSearchParams(this.props.location.search);

    this.setState(
      {
        selectedCluster: clusterId,
        search: query.get('search') ? query.get('search') : search,
        pageNumber: query.get('page') ? parseInt(query.get('page')) : parseInt(pageNumber)
      },
      () => {
        this.getConsumerGroup();
      }
    );
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.location.search !== prevProps.location.search) {
      // Handle back navigation
      if (this.props.router.navigationType === 'POP') {
        let { clusterId } = this.props.params;
        const { search, pageNumber } = this.state;
        const query = new URLSearchParams(this.props.location.search);
        this.setState(
          {
            selectedCluster: clusterId,
            search: query.get('search'),
            pageNumber: query.get('page') ? parseInt(query.get('page')) : parseInt(pageNumber)
          },
          () => {
            this.getConsumerGroup(false);
          }
        );
      } else if (this.props.location.search === '') {
        // Handle sidebar click on schema registry from the component
        this.setState(
          {
            searchData: { search: '' },
            pageNumber: 1
          },
          () => {
            this.getConsumerGroup(false);
          }
        );
      }
    }
  }

  handleSearch = data => {
    this.setState({ pageNumber: 1, search: data.searchData.search }, () => {
      this.getConsumerGroup(false);
    });
  };

  handlePageChangeSubmission = (value, replaceInNavigation) => {
    let pageNumber = getPageNumber(value, this.state.totalPageNumber);
    this.setState({ pageNumber: pageNumber }, () => {
      this.getConsumerGroup(replaceInNavigation);
    });
  };

  async getConsumerGroup(replaceInNavigation = true) {
    const { selectedCluster, pageNumber, search } = this.state;
    this.setState({ loading: true });

    let response = await this.getApi(uriConsumerGroups(selectedCluster, search, pageNumber));
    response = response.data;
    if (response.results) {
      this.handleConsumerGroup(response.results);
      this.setState({ selectedCluster, totalPageNumber: response.page }, () =>
        this.props.router.navigate(
          {
            pathname: `/ui/${this.state.selectedCluster}/group`,
            search: `search=${this.state.search}&page=${pageNumber}`
          },
          { replace: replaceInNavigation }
        )
      );
    } else {
      this.setState({ selectedCluster, consumerGroups: [], totalPageNumber: 1, loading: false });
    }
  }

  handleConsumerGroup(consumerGroup) {
    let tableConsumerGroup = [];
    consumerGroup.forEach(consumerGroup => {
      tableConsumerGroup.push({
        id: consumerGroup.id,
        state: consumerGroup.state,
        coordinator: consumerGroup.coordinator.id,
        members: consumerGroup.members ? consumerGroup.members.length : 0,
        topics: consumerGroup.offsets ? groupedTopicOffset(consumerGroup.offsets) : {}
      });
    });

    this.setState({ consumerGroups: tableConsumerGroup, loading: false });
  }

  handleState(state) {
    let className = '';

    switch (state) {
      case 'STABLE':
        className = 'badge bg-success';
        break;
      case 'PREPARING_REBALANCE':
        className = 'badge bg-primary';
        break;
      default:
        className = 'badge bg-warning';
        break;
    }

    return <span className={className}>{state.replace('_', ' ')}</span>;
  }

  handleCoordinator(coordinator) {
    return <span className="badge bg-primary"> {coordinator}</span>;
  }

  handleTopics(group, groupedTopicOffset) {
    const noPropagation = e => e.stopPropagation();
    return Object.keys(groupedTopicOffset).map(topicId => {
      const topicOffsets = groupedTopicOffset[topicId];
      const offsetLag = calculateTopicOffsetLag(topicOffsets, topicId);

      return (
        <Link
          to={`/ui/${this.state.selectedCluster}/topic/${topicId}`}
          key={group + '-' + topicId}
          className="btn btn-dark btn-sm mb-1 me-1"
          onClick={noPropagation}
        >
          {topicId}{' '}
          <div className="badge bg-secondary">Lag: {Number(offsetLag).toLocaleString()}</div>
        </Link>
      );
    });
  }

  handleOnDelete(group) {
    this.setState({ groupToDelete: group }, () => {
      this.showDeleteModal(
        <React.Fragment>
          Do you want to delete consumer group: {<code>{group.id}</code>} ?
        </React.Fragment>
      );
    });
  }

  showDeleteModal = deleteMessage => {
    this.setState({ showDeleteModal: true, deleteMessage });
  };

  closeDeleteModal = () => {
    this.setState({ showDeleteModal: false, deleteMessage: '' });
  };

  deleteConsumerGroup = () => {
    const { selectedCluster, groupToDelete } = this.state;

    this.removeApi(uriConsumerGroupDelete(selectedCluster, encodeURIComponent(groupToDelete.id)))
      .then(() => {
        toast.success(`Consumer Group '${groupToDelete.id}' is deleted`);
        this.setState({ showDeleteModal: false, groupToDelete: {} }, () => this.getConsumerGroup());
      })
      .catch(() => {
        this.setState({ showDeleteModal: false, groupToDelete: {} });
      });
  };
  render() {
    const { selectedCluster, search, pageNumber, totalPageNumber, loading } = this.state;
    const roles = this.state.roles || {};

    return (
      <div>
        <Header title="Consumer Groups" />
        <nav className="navbar navbar-expand-lg navbar-light bg-light me-auto khq-data-filter khq-sticky khq-nav">
          <SearchBar
            showSearch={true}
            search={search}
            showPagination={true}
            pagination={pageNumber}
            showTopicListView={false}
            showConsumerGroup
            groupListView={'ALL'}
            doSubmit={this.handleSearch}
          />

          <Pagination
            pageNumber={pageNumber}
            totalPageNumber={totalPageNumber}
            onChange={handlePageChange}
            onSubmit={value => this.handlePageChangeSubmission(value, false)}
          />
        </nav>

        <Table
          loading={loading}
          columns={[
            {
              id: 'id',
              accessor: 'id',
              colName: 'Id'
            },
            {
              id: 'state',
              accessor: 'state',
              colName: 'State',
              cell: obj => {
                return this.handleState(obj.state);
              }
            },
            {
              id: 'coordinator',
              accessor: 'coordinator',
              colName: 'Coordinator',
              cell: obj => {
                return this.handleCoordinator(obj.coordinator);
              }
            },
            {
              id: 'members',
              accessor: 'members',
              colName: 'Members'
            },
            {
              id: 'topics',
              accessor: 'topics',
              colName: 'Topics',
              cell: obj => {
                if (obj.topics) {
                  return this.handleTopics(obj.id, obj.topics);
                }
              }
            }
          ]}
          data={this.state.consumerGroups}
          updateData={data => {
            this.setState({ consumerGroups: data });
          }}
          noContent={'No consumer group available'}
          onDelete={group => {
            this.handleOnDelete(group);
          }}
          onDetails={id => {
            this.props.router.navigate(`/ui/${selectedCluster}/group/${encodeURIComponent(id)}`);
          }}
          actions={
            roles.CONSUMER_GROUP && roles.CONSUMER_GROUP.includes('DELETE')
              ? [constants.TABLE_DELETE, constants.TABLE_DETAILS]
              : [constants.TABLE_DETAILS]
          }
        />

        <ConfirmModal
          show={this.state.showDeleteModal}
          handleCancel={this.closeDeleteModal}
          handleConfirm={this.deleteConsumerGroup}
          message={this.state.deleteMessage}
        />
      </div>
    );
  }
}
export default withRouter(ConsumerGroupList);
