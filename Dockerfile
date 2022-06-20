FROM node:17
ENV NODE_ENV=production
RUN mkdir cloudsql
RUN chmod 777 cloudsql
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
CMD npm start

