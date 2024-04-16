import React from 'react';
import PropTypes from 'prop-types';
import Sidebar from '../../containers/SideBar';
import constants from '../../utils/constants';
import Loading from '../../containers/Loading';
import { Helmet } from 'react-helmet';
import Root from '../../components/Root';
import { withRouter } from '../../utils/withRouter';

class Base extends Root {
  state = {
    clusterId: '',
    topicId: '',
    selectedTab: constants.CLUSTER, //cluster | node | topic | tail | group | acls | schema | connect
    action: '',
    loading: false,
    expanded: !!localStorage.getItem('expanded')
  };

  static getDerivedStateFromProps(nextProps) {
    const clusterId = nextProps ? nextProps.params.clusterId : '';
    const topicId = nextProps ? nextProps.params.topicId : '';
    const action = nextProps ? nextProps.params.action : '';
    const loading = nextProps.location ? nextProps.location.loading : false;
    const tab = nextProps.location ? nextProps.location.tab : constants.CLUSTER;
    return {
      topicId: topicId,
      clusterId: clusterId,
      selectedTab: tab,
      action: action,
      loading
    };
  }

  handleTitle() {
    const page = window.location.pathname;
    let title = '';
    if (page.includes('node')) {
      title = 'Nodes |';
    }
    if (page.includes('topic')) {
      title = 'Topics |';
    }
    if (page.includes('tail')) {
      title = 'Live Tail |';
    }
    if (page.includes('group')) {
      title = 'Consumer Groups |';
    }
    if (page.includes('acls')) {
      title = 'Acls |';
    }
    if (page.includes('schema')) {
      title = 'Schema Registry |';
    }
    if (page.includes('connect')) {
      title = 'Connect |';
    }

    return title + ' akhq.io';
  }

  componentWillUnmount() {
    clearTimeout(this.interval);
  }

  render() {
    const { children, clusters } = this.props;
    const { loading, selectedTab, expanded } = this.state;
    return (
      <>
        <Helmet title={this.handleTitle()} />
        <Loading show={loading} />
        {this.props.location.pathname !== '/ui/login' &&
          this.props.location.pathname !== '/ui/page-not-found' && (
            <Sidebar
              clusters={clusters}
              expanded={expanded}
              toggleSidebar={newExpanded => {
                newExpanded
                  ? localStorage.setItem('expanded', newExpanded)
                  : localStorage.removeItem('expanded');
                this.setState({ expanded: newExpanded });
              }}
              selectedTab={selectedTab}
            />
          )}
        <div id="content" className={expanded ? 'expanded' : 'collapsed'}>
          {children}
        </div>
      </>
    );
  }
}

Base.propTypes = {
  location: PropTypes.object,
  clusters: PropTypes.array,
  children: PropTypes.any
};

export default withRouter(Base);
