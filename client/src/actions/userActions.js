import axios from 'axios';
import {
  USER_LOGIN_FAIL,
  USER_GET_USER_INFO,
  USER_LOGIN_REQUEST,
  USER_LOGIN_SUCCESS,
  USER_LOGOUT_SUCCESS,
  USER_LOGOUT_REQUEST,
  USER_UPDATE_USER_INFO,
} from '../constants/userConstants';

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: USER_LOGIN_REQUEST });

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const { data } = await axios.post(
      'http://127.0.0.1:8000/api/login/',
      formData,
      config
    );

    localStorage.setItem('tokenData', JSON.stringify(data));
    dispatch({
      type: USER_LOGIN_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({ type: USER_LOGIN_FAIL });
  }
};

export const logout = () => async (dispatch) => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  dispatch({ type: USER_LOGOUT_REQUEST });
  localStorage.removeItem('tokenData');
  await delay(500);
  dispatch({ type: USER_LOGOUT_SUCCESS });
};

export const getUserInfoFromServer = () => async (dispatch) => {
  try {
    const tokenData = JSON.parse(localStorage.getItem('tokenData'));
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenData.accessToken}`,
      },
    };

    const { data } = await axios.get(
      'http://127.0.0.1:8000/api/users/',
      config
    );
    const userInfo = {
      username: data[0].username,
      email: data[0].email,
    };
    dispatch({ type: USER_GET_USER_INFO, payload: userInfo });
  } catch {}
};

export const updateUserInfo = (updatedUserInfo) => async (dispatch) => {
  try {
    const tokenData = JSON.parse(localStorage.getItem('tokenData'));
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${tokenData.accessToken}`,
      },
    };

    const { data } = await axios.put(
      'http://127.0.0.1:8000/api/users/',
      updatedUserInfo,
      config
    );
    dispatch({ type: USER_UPDATE_USER_INFO, payload: data });
  } catch {}
} 