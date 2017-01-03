
-- user

CREATE TABLE `USER` (
  `USER_ID` varchar(40) NOT NULL DEFAULT '',
  `USER_NAME` varchar(40) DEFAULT NULL,
  `USER_TOKKEN` varchar(255) DEFAULT NULL,
  `USER_DT` datetime DEFAULT NULL,
  PRIMARY KEY (`USER_ID`)
);

-- pad

CREATE TABLE `PAD` (
  `PAD_ID` INTEGER NOT NULL DEFAULT 0,
  `USER_ID` varchar(40) DEFAULT NULL,
  `PAD_NAME` varchar(40) DEFAULT NULL,
  `PAD_STATE` varchar(150) DEFAULT NULL,
  `PAD_DT` datetime DEFAULT NULL,
  PRIMARY KEY (`PAD_ID`)
);

-- revisions

CREATE TABLE `REVISION` (
  `REVISION_ID` INTEGER NOT NULL DEFAULT 0,
  `PAD_ID` INTEGER DEFAULT NULL,
  `REVISION_CONTENT` text,
  `REVISION_DT` datetime DEFAULT NULL,
  PRIMARY KEY (`REVISION_ID`)
);