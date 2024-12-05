# Comprehensive API Documentation

## Profiles

### visits

### http://localhost:3000/api/profiles/{user_id}/visits
**Endpoint:** `POST http://localhost:3000/api/profiles/4135adeb-6426-4664-aea2-c8b773cca263/visits`

**Headers:**
- Content-Type: application/json

**React Example:**
```tsx
import axios from 'axios';

const sendData = async (data) => {
  const response = await axios.post('http://localhost:3000/api/profiles/4135adeb-6426-4664-aea2-c8b773cca263/visits', data);
  console.log(response.data);
};
sendData({});
```

---

### http://localhost:3000/api/profiles/visits
**Endpoint:** `GET http://localhost:3000/api/profiles/visits`

**Headers:**
- Content-Type: application/json

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/profiles/visits');
  console.log(response.data);
};
fetchData();
```

---

### interests

### http://localhost:3000/api/profiles/me/interests
**Endpoint:** `POST http://localhost:3000/api/profiles/me/interests`

**Headers:**
- Content-Type: application/x-www-form-urlencoded

**Request Body:**
- interests: diving (text)
- interests: cycling (text)
- interests: gaming (text)

**React Example:**
```tsx
import axios from 'axios';

const sendData = async (data) => {
  const response = await axios.post('http://localhost:3000/api/profiles/me/interests', data);
  console.log(response.data);
};
sendData({});
```

---

### http://localhost:3000/api/profiles/me/interests
**Endpoint:** `GET http://localhost:3000/api/profiles/me/interests`

**Headers:**
- Content-Type: application/x-www-form-urlencoded

**Request Body:**

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/profiles/me/interests');
  console.log(response.data);
};
fetchData();
```

---

### http://localhost:3000/api/profiles/{user_id}/interests
**Endpoint:** `GET http://localhost:3000/api/profiles/4135adeb-6426-4664-aea2-c8b773cca263/interests`

**Headers:**
- Content-Type: application/x-www-form-urlencoded

**Request Body:**

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/profiles/4135adeb-6426-4664-aea2-c8b773cca263/interests');
  console.log(response.data);
};
fetchData();
```

---

### http://localhost:3000/api/profiles/me/interests
**Endpoint:** `DELETE http://localhost:3000/api/profiles/me/interests`

**Headers:**
- Content-Type: application/x-www-form-urlencoded

**Request Body:**
- interests[]: golf (text)
- interests: cycling (text)

---

### pictures

### http://localhost:3000/api/profiles/me/pictures
**Endpoint:** `POST http://localhost:3000/api/profiles/me/pictures`

**Headers:**
- Content-Type: application/x-www-form-urlencoded

**Request Body:**
- pictures: https://picsum.photos/id/19/200/200 (text)
- pictures: https://picsum.photos/id/16/200/200 (text)

**React Example:**
```tsx
import axios from 'axios';

const sendData = async (data) => {
  const response = await axios.post('http://localhost:3000/api/profiles/me/pictures', data);
  console.log(response.data);
};
sendData({});
```

---

### http://localhost:3000/api/profiles/me/pictures
**Endpoint:** `GET http://localhost:3000/api/profiles/me/pictures`

**Request Body:**

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/profiles/me/pictures');
  console.log(response.data);
};
fetchData();
```

---

### http://localhost:3000/api/profiles/me/pictures
**Endpoint:** `DELETE http://localhost:3000/api/profiles/me/pictures`

**Headers:**
- Content-Type: application/x-www-form-urlencoded

**Request Body:**
- pictures: https://picsum.photos/id/19/200/200 (text)
- pictures: https://picsum.photos/id/13/200/200 (text)

---

### likes

### http://localhost:3000/api/profiles/{user_id}/like
**Endpoint:** `POST http://localhost:3000/api/profiles/4135adeb-6426-4664-aea2-c8b773cca263/like`

**Headers:**
- Content-Type: application/json

**React Example:**
```tsx
import axios from 'axios';

const sendData = async (data) => {
  const response = await axios.post('http://localhost:3000/api/profiles/4135adeb-6426-4664-aea2-c8b773cca263/like', data);
  console.log(response.data);
};
sendData({});
```

---

### http://localhost:3000/api/profiles/{user_id}/dislike
**Endpoint:** `POST http://localhost:3000/api/profiles/4135adeb-6426-4664-aea2-c8b773cca263/dislike`

**Headers:**
- Content-Type: application/json

**React Example:**
```tsx
import axios from 'axios';

const sendData = async (data) => {
  const response = await axios.post('http://localhost:3000/api/profiles/4135adeb-6426-4664-aea2-c8b773cca263/dislike', data);
  console.log(response.data);
};
sendData({});
```

---

### http://localhost:3000/api/profiles/{user_id}/like
**Endpoint:** `DELETE http://localhost:3000/api/profiles/4135adeb-6426-4664-aea2-c8b773cca263/like`

**Headers:**
- Content-Type: application/json

---

### http://localhost:3000/api/profiles/likes
**Endpoint:** `GET http://localhost:3000/api/profiles/likes`

**Headers:**
- Content-Type: application/json

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/profiles/likes');
  console.log(response.data);
};
fetchData();
```

---

### http://localhost:3000/api/profiles/matched
**Endpoint:** `GET http://localhost:3000/api/profiles/matched`

**Headers:**
- Content-Type: application/json

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/profiles/matched');
  console.log(response.data);
};
fetchData();
```

---

### blocks

### http://localhost:3000/api/profiles/blocks
**Endpoint:** `GET http://localhost:3000/api/profiles/blocks`

**Headers:**
- Content-Type: application/json

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/profiles/blocks');
  console.log(response.data);
};
fetchData();
```

---

### http://localhost:3000/api/profiles/{user_id}/block
**Endpoint:** `POST http://localhost:3000/api/profiles/5dc55f51-0704-4ba7-b5eb-9c712a05c03f/block`

**Headers:**
- Content-Type: application/json

**React Example:**
```tsx
import axios from 'axios';

const sendData = async (data) => {
  const response = await axios.post('http://localhost:3000/api/profiles/5dc55f51-0704-4ba7-b5eb-9c712a05c03f/block', data);
  console.log(response.data);
};
sendData({});
```

---

### http://localhost:3000/api/profiles/{user_id}/block
**Endpoint:** `DELETE http://localhost:3000/api/profiles/5dc55f51-0704-4ba7-b5eb-9c712a05c03f/block`

**Headers:**
- Content-Type: application/json

**Request Body:**
- reason: scammer asked for money (text)

---

### reports

### http://localhost:3000/api/profiles/reports
**Endpoint:** `GET http://localhost:3000/api/profiles/reports`

**Headers:**
- Content-Type: application/json

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/profiles/reports');
  console.log(response.data);
};
fetchData();
```

---

### http://localhost:3000/api/profiles/{user_id}/report
**Endpoint:** `POST http://localhost:3000/api/profiles/6f15f473-57f8-4ed8-b3ea-3cdfce2dfb9e/report`

**Headers:**
- Content-Type: application/json

**Request Body:**
- reason: scammer asked for money (text)

**React Example:**
```tsx
import axios from 'axios';

const sendData = async (data) => {
  const response = await axios.post('http://localhost:3000/api/profiles/6f15f473-57f8-4ed8-b3ea-3cdfce2dfb9e/report', data);
  console.log(response.data);
};
sendData({});
```

---

### http://localhost:3000/api/profiles
**Endpoint:** `GET http://localhost:3000/api/profiles`

**Headers:**
- Content-Type: application/json

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/profiles');
  console.log(response.data);
};
fetchData();
```

---

### http://localhost:3000/api/profiles/{user_id}
**Endpoint:** `GET http://localhost:3000/api/profiles/4135adeb-6426-4664-aea2-c8b773cca263`

**Headers:**
- Content-Type: application/json

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/profiles/4135adeb-6426-4664-aea2-c8b773cca263');
  console.log(response.data);
};
fetchData();
```

---

### http://localhost:3000/api/profiles/me
**Endpoint:** `GET http://localhost:3000/api/profiles/me`

**Headers:**
- Content-Type: application/json

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/profiles/me');
  console.log(response.data);
};
fetchData();
```

---

### http://localhost:3000/api/profiles/me
**Endpoint:** `PATCH http://localhost:3000/api/profiles/me`

**Headers:**
- Content-Type: application/x-www-form-urlencoded

**Request Body:**
- gender: male (text)
- age: 30 (text)
- sexual_preference: female (text)
- biography: I am your fatherrrrr (text)
- profile_picture: your_profile_picture_url (text)
- gps_longitude: 180 (text)
- gps_latitude: -20.946823 (text)

**React Example:**
```tsx
import axios from 'axios';

const updateData = async (data) => {
  const response = await axios.patch('http://localhost:3000/api/profiles/me', data);
  console.log(response.data);
};
updateData({});
```

---

### http://localhost:3000/api/profiles/me
**Endpoint:** `POST http://localhost:3000/api/profiles/me`

**Headers:**
- Content-Type: application/x-www-form-urlencoded

**Request Body:**
- gender: female (text)
- age: 19 (text)
- sexual_preference: heterosexual (text)
- biography: Hello (text)
- profile_picture: https://picsum.photos/id/19/200/200 (text)
- gps_latitude: -20.946823 (text)
- gps_longitude: 210.807416 (text)

**React Example:**
```tsx
import axios from 'axios';

const sendData = async (data) => {
  const response = await axios.post('http://localhost:3000/api/profiles/me', data);
  console.log(response.data);
};
sendData({});
```

---

## Users

### http://localhost:3000/api/users/me
**Endpoint:** `GET http://localhost:3000/api/users/me`

**Request Body:**

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/users/me');
  console.log(response.data);
};
fetchData();
```

---

### http://localhost:3000/api/users/me
**Endpoint:** `DELETE http://localhost:3000/api/users/me`

**Request Body:**

---

### http://localhost:3000/api/users/me
**Endpoint:** `PATCH http://localhost:3000/api/users/me`

**Headers:**
- Content-Type: application/x-www-form-urlencoded

**Request Body:**
- username: adolfus (text)
- email: your_email@example.com (text)
- first_name: your_first_name (text)
- last_name: your_last_name (text)
- phone: 1234 (text)

**React Example:**
```tsx
import axios from 'axios';

const updateData = async (data) => {
  const response = await axios.patch('http://localhost:3000/api/users/me', data);
  console.log(response.data);
};
updateData({});
```

---

## Auth

### http://localhost:3000/api/signup
**Endpoint:** `POST http://localhost:3000/api/signup`

**Request Body:**
- firstName: TestFirstName (text)
- username: test1 (text)
- lastName: TestLastName (text)
- email: test1@gmail.com (text)
- password: jsdvSDFv2343*"niuniu (text)

**React Example:**
```tsx
import axios from 'axios';

const sendData = async (data) => {
  const response = await axios.post('http://localhost:3000/api/signup', data);
  console.log(response.data);
};
sendData({});
```

---

### http://localhost:3000/api/login
**Endpoint:** `POST http://localhost:3000/api/login`

**Request Body:**
- username: test1@gmail.com (text)
- password: jsdvSDFv2343*"niuniu (text)

**React Example:**
```tsx
import axios from 'axios';

const sendData = async (data) => {
  const response = await axios.post('http://localhost:3000/api/login', data);
  console.log(response.data);
};
sendData({});
```

---

### http://localhost:3000/api/logout
**Endpoint:** `GET http://localhost:3000/api/logout`

**Request Body:**
- username: stefanrab19@gmail.com (text)
- password: jsdvSDFv2343*"niuniu (text)

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/logout');
  console.log(response.data);
};
fetchData();
```

---

### http://localhost:3000/api/check-auth
**Endpoint:** `GET http://localhost:3000/api/check-auth`

**Request Body:**

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/check-auth');
  console.log(response.data);
};
fetchData();
```

---

### http://localhost:3000/api/reset-password
**Endpoint:** `POST http://localhost:3000/api/reset-password`

**Request Body:**
- email: stefanrab465@gmail.com (text)

**React Example:**
```tsx
import axios from 'axios';

const sendData = async (data) => {
  const response = await axios.post('http://localhost:3000/api/reset-password', data);
  console.log(response.data);
};
sendData({});
```

---

### http://localhost:3000/api/resend-verification-email
**Endpoint:** `POST http://localhost:3000/api/resend-verification-email`

**Request Body:**
- email: stefandukic209@gmail.com (text)

**React Example:**
```tsx
import axios from 'axios';

const sendData = async (data) => {
  const response = await axios.post('http://localhost:3000/api/resend-verification-email', data);
  console.log(response.data);
};
sendData({});
```

---

### http://localhost:3000/api/verify-email
**Endpoint:** `PATCH http://localhost:3000/api/verify-email`

**Request Body:**
- token: b3a4191f-e3ac-4bfe-ab92-7842297dfd00 (text)

**React Example:**
```tsx
import axios from 'axios';

const updateData = async (data) => {
  const response = await axios.patch('http://localhost:3000/api/verify-email', data);
  console.log(response.data);
};
updateData({});
```

---

### http://localhost:3000/api/reset-password
**Endpoint:** `PATCH http://localhost:3000/api/reset-password`

**Request Body:**
- token: 572e2a34-1bcd-4172-b28c-638d3684bfc3 (text)
- password: new123UHUHUH332L&/ (text)

**React Example:**
```tsx
import axios from 'axios';

const updateData = async (data) => {
  const response = await axios.patch('http://localhost:3000/api/reset-password', data);
  console.log(response.data);
};
updateData({});
```

---

## Chat

### http://localhost:3000/api/chat/{user_id}
**Endpoint:** `POST http://localhost:3000/api/chat/83660d5f-2b51-41a0-b9ef-0bd9d7dbaa01`

**Headers:**
- Content-Type: application/json

**Request Body (raw):**
```json
{
  "message": "Hello! How are you?"
}
```

**React Example:**
```tsx
import axios from 'axios';

const sendData = async (data) => {
  const response = await axios.post('http://localhost:3000/api/chat/83660d5f-2b51-41a0-b9ef-0bd9d7dbaa01', data);
  console.log(response.data);
};
sendData({});
```

---

### http://localhost:3000/api/chats
**Endpoint:** `GET http://localhost:3000/api/chats/5dc55f51-0704-4ba7-b5eb-9c712a05c03f`

**Headers:**
- Content-Type: application/json

**Request Body (raw):**
```json
{
  "message": "Hello! How are you?"
}
```

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/chats/5dc55f51-0704-4ba7-b5eb-9c712a05c03f');
  console.log(response.data);
};
fetchData();
```

---

## Notifications

### http://localhost:3000/api/notifications
**Endpoint:** `GET http://localhost:3000/api/notifications`

**Headers:**
- Content-Type: application/json

**React Example:**
```tsx
import axios from 'axios';

const fetchData = async () => {
  const response = await axios.get('http://localhost:3000/api/notifications');
  console.log(response.data);
};
fetchData();
```

---

