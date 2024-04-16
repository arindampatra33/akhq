import React from 'react';

import { Link } from 'react-router-dom';
import { withRouter } from '../../utils/withRouter';
import { organizeRoles } from '../../utils/converters';
import { logout } from '../../utils/api';
import { uriCurrentUser, uriLogout } from '../../utils/endpoints';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Root from '../../components/Root';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignIn } from '@fortawesome/free-solid-svg-icons';

class Header extends Root {
  state = {
    login: sessionStorage.getItem('login'),
    username: sessionStorage.getItem('user'),
    auths: JSON.parse(sessionStorage.getItem('auths')),
    goBack: true
  };

  // unauthorizedGoBack = ['topic', 'node', 'tail', 'group', 'acls', 'schema'];
  //
  // componentDidMount() {
  //   const url = window.location.pathname.split('/');
  //   this.unauthorizedGoBack.forEach(el => {
  //     if ('' === url[url.length - 1] ||  el === url[url.length - 1] || 'connect' === url[url.length - 2]) {
  //       this.setState({ goBack: false });
  //     }
  //   });
  //   this.goBack = this.goBack.bind(this);
  // }

  // goBack() {
  //   history.back();
  // }

  async logout() {
    await logout(uriLogout());
    await this.getApi(uriCurrentUser()).then(res => {
      let currentUserData = res.data;
      sessionStorage.setItem('login', currentUserData.logged);
      sessionStorage.setItem('user', 'default');
      sessionStorage.setItem('roles', organizeRoles(currentUserData.roles));
      localStorage.removeItem('jwtToken');
      this.setState({ login: currentUserData.logged }, () => {
        toast.success('Logged out successfully');
        this.props.router.navigate({ pathname: '/ui/login' }, { replace: true });
      });
    });
  }

  _renderLogin() {
    const { login, username, auths } = this.state;
    if (auths && auths.loginEnabled) {
      return login === 'false' || !login ? (
        <Link to="/ui/login">
          <button className="btn btn-primary">
            <FontAwesomeIcon icon={faSignIn} aria-hidden={true} /> Login
          </button>
        </Link>
      ) : (
        <Link to="#">
          <button
            className="btn btn-primary"
            onClick={() => {
              this.logout();
            }}
          >
            <FontAwesomeIcon icon={faSignIn} aria-hidden={true} /> {username} (Logout)
          </button>
        </Link>
      );
    } else if (auths && username) {
      return (
        <button className="btn btn-primary" disabled>
          <FontAwesomeIcon icon={faSignIn} aria-hidden={true} /> {username}
        </button>
      );
    } else {
      return <></>;
    }
  }

  render() {
    const { title, children } = this.props;
    return (
      <React.Fragment>
        <div
          className="title"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          {' '}
          <h1>{title}</h1>{' '}
          <div>
            {this._renderLogin()}
            {children}
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default withRouter(Header);
