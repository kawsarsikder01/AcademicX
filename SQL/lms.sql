-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: lms
-- ------------------------------------------------------
-- Server version	8.0.44-0ubuntu0.24.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` mediumint DEFAULT NULL COMMENT 'role_id',
  `name` varchar(255) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `image` varchar(150) DEFAULT NULL,
  `driver` varchar(10) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `email_verification` tinyint(1) NOT NULL DEFAULT '1',
  `sms_verification` tinyint(1) NOT NULL DEFAULT '1',
  `verify_code` int unsigned DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `last_seen` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `two_fa` tinyint(1) NOT NULL DEFAULT '0',
  `two_fa_verify` tinyint(1) NOT NULL DEFAULT '0',
  `two_fa_code` varchar(100) DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `roles_index` (`role_id`),
  KEY `admin_username_index` (`username`),
  KEY `admin_email_index` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (1,NULL,'Admin','admin','admin@gmail.com','01795909700',NULL,NULL,NULL,'$2a$12$jf9ZSaZspLTmEEKTrumAAOuuqe1rhA.Q.q/tKxDeQlMuq/vTyBAT2','Dhaka',1,1,1,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'2025-11-01 15:12:02','2025-11-01 15:12:02');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Web Development','web-development',1,'2025-11-17 07:21:11','2025-11-17 07:21:11'),(2,'Programming','programming',1,'2025-11-29 22:28:03','2025-11-29 22:28:03');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text,
  `course_overview` text,
  `category_id` int DEFAULT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `driver` varchar(20) DEFAULT 'local',
  `price` decimal(10,2) DEFAULT '0.00',
  `discount` decimal(5,2) DEFAULT '0.00',
  `course_type` enum('recorded','live','hybrid') DEFAULT 'recorded',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `enrollment_close_date` datetime DEFAULT NULL,
  `streaming_server` enum('internal','external') DEFAULT 'internal',
  `status` enum('draft','pending','published','rejected') DEFAULT 'draft',
  `total_hour` int NOT NULL,
  `rating` float NOT NULL DEFAULT '0',
  `total_rating` int NOT NULL DEFAULT '0',
  `introVideoUrl` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total_students` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (1,1,'Full Stack Web Development for Beginners (Full Course on HTML, CSS, JavaScript, Node.js, MongoDB)','full-stack-web-development-for-beginners-full-course-on-html-css-javascript-nodejs-mongodb','Master modern web development with HTML, CSS, JavaScript, React, Node.js, and more. Build real-world projects and become a professional developer.','<h2><strong style=\"background-color: rgb(255, 255, 255); color: rgb(2, 8, 23);\">What you\'ll learn</strong></h2><p><span style=\"background-color: rgb(255, 255, 255); color: rgb(100, 116, 139);\">Build professional websites from scratch</span></p><p><span style=\"background-color: rgb(255, 255, 255); color: rgb(100, 116, 139);\">Master HTML5, CSS3, and JavaScript</span></p><p><span style=\"background-color: rgb(255, 255, 255); color: rgb(100, 116, 139);\">Create responsive designs for all devices</span></p><p><span style=\"background-color: rgb(255, 255, 255); color: rgb(100, 116, 139);\">Work with React and modern frameworks</span></p><p><span style=\"background-color: rgb(255, 255, 255); color: rgb(100, 116, 139);\">Build full-stack applications with Node.js</span></p><p><span style=\"background-color: rgb(255, 255, 255); color: rgb(100, 116, 139);\">Deploy applications to production</span></p><h2><strong style=\"background-color: rgb(255, 255, 255); color: rgb(2, 8, 23);\">Requirements</strong></h2><ol><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span><span style=\"background-color: rgb(255, 255, 255); color: rgb(100, 116, 139);\">A computer with internet connection</span></li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span><span style=\"background-color: rgb(255, 255, 255); color: rgb(100, 116, 139);\">No prior programming experience required</span></li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span><span style=\"background-color: rgb(255, 255, 255); color: rgb(100, 116, 139);\">Willingness to learn and practice</span></li></ol><h2><strong style=\"background-color: rgb(255, 255, 255); color: rgb(2, 8, 23);\">Description</strong></h2><p><span style=\"background-color: rgb(255, 255, 255); color: rgb(100, 116, 139);\">Welcome to the Complete Web Development Bootcamp! This comprehensive course will take you from complete beginner to professional web developer. You\'ll learn everything you need to know to build modern, responsive websites and web applications.</span></p><p><span style=\"background-color: rgb(255, 255, 255); color: rgb(100, 116, 139);\">Throughout the course, you\'ll work on real-world projects and build a professional portfolio that will help you land your dream job. Join thousands of students who have already transformed their careers with this course.</span></p><p><br></p>',1,NULL,'local',100.00,10.00,'recorded',NULL,NULL,NULL,'internal','published',24,0,0,'https://youtu.be/nu_pCVPKzTk','2025-11-28 17:08:51','2025-11-29 15:58:13',0),(2,1,'Harvard CS50’s Artificial Intelligence with Python – Full University Course','harvard-cs50s-artificial-intelligence-with-python-full-university-course','This course from Harvard University explores the concepts and algorithms at the foundation of modern artificial intelligence, diving into the ideas that give rise to technologies like large language models, game-playing engines, handwriting recognition, and machine translation. Through hands-on projects, students gain exposure to the theory behind graph search algorithms, classification, optimization, reinforcement learning, and other topics in artificial intelligence and machine learning as they incorporate them into their own Python programs.','<h2>? What is CS50 AI with Python</h2><ol><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>CS50 AI is a follow-up course from CS50x (or at least assumes you already know basic Python). </li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>It’s offered by Harvard University (via its School of Engineering &amp; Applied Sciences) and delivered online — you don’t need to be a Harvard student.</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>The course length is about <strong>7 weeks</strong>, with a suggested workload of <strong>10–30 hours/week</strong>, depending on how deeply you engage. </li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>You can audit it for free (no certificate), or pay for a verified certificate. </li></ol><h2>? What you’ll learn — Topics &amp; Structure</h2><p>The course dives into foundational concepts of artificial intelligence, combining theory + hands-on Python programming. Among the main topics:</p><ol><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span><strong>Graph search algorithms</strong>: algorithms used for exploring &amp; searching through spaces like navigation, game states, etc.</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span><strong>Knowledge representation &amp; reasoning</strong>: logic, inference, probability, uncertainty &amp; reasoning under uncertainty.</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span><strong>Optimization &amp; constraint-satisfaction</strong>: techniques for solving complex and constrained problems.</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span><strong>Machine learning</strong>: building models that learn from data — classification, optimization, etc.</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span><strong>Neural networks &amp; modern AI techniques</strong>: including more advanced models (in later sections of the course).</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span><strong>Natural Language Processing (NLP) / Language &amp; AI-driven systems</strong>: handling language and creating systems capable of tasks like machine translation, text understanding, etc.</li></ol><p>By the end of the course, you’ll have built Python programs incorporating AI/ML — giving you both conceptual understanding <em>and</em> practical experience. </p><h2>✅ Prerequisites &amp; Who It’s For</h2><ol><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>You should know <strong>Python</strong>, preferably with at least a year of experience (or have completed CS50x/CS50-style intro to computer science). </li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>It’s suitable for: students, independent learners, developers — anyone who wants a solid foundation in AI/ML without prior deep expertise.</li><li data-list=\"bullet\"><span class=\"ql-ui\" contenteditable=\"false\"></span>The course balances theory + coding, so people who enjoy both will benefit most.</li></ol><p><br></p>',2,NULL,'local',99.00,0.00,'recorded',NULL,NULL,NULL,'internal','published',11,0,0,'https://youtu.be/5NgNicANyqM','2025-11-29 16:49:46','2026-01-22 14:44:16',0);
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lessons`
--

DROP TABLE IF EXISTS `lessons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lessons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `content` text,
  `lesson_type` enum('video','live') DEFAULT 'video',
  `video_file_path` varchar(255) DEFAULT NULL,
  `video_storage_type` enum('local','s3','cdn') DEFAULT 'local',
  `live_start_time` datetime DEFAULT NULL,
  `live_end_time` datetime DEFAULT NULL,
  `position` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `lessons_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lessons`
--

LOCK TABLES `lessons` WRITE;
/*!40000 ALTER TABLE `lessons` DISABLE KEYS */;
INSERT INTO `lessons` VALUES (1,1,'Introduction to HTML','HTML (HyperText Markup Language) is the backbone of web development. It defines the structure of web pages using elements like headings, paragraphs, links, images, and lists.',NULL,'video',NULL,'local',NULL,NULL,1,'2025-11-28 17:08:51','2025-11-28 17:08:51'),(2,1,'Introduction to CSS','CSS (Cascading Style Sheets) is used to style HTML elements. You can control layout, colors, fonts, and responsiveness with CSS.',NULL,'video',NULL,'local',NULL,NULL,2,'2025-11-28 17:08:51','2025-11-28 17:08:51'),(3,1,'JavaScript Basics','JavaScript is a programming language used to make web pages interactive. It can manipulate HTML and CSS dynamically and handle events like clicks and form submissions.',NULL,'video',NULL,'local',NULL,NULL,3,'2025-11-28 17:08:51','2025-11-28 17:08:51'),(4,2,'What is AI?','Definitions & history',NULL,'video',NULL,'local',NULL,NULL,1,'2025-11-29 16:49:46','2025-11-29 16:49:46'),(5,2,'Python Foundations for AI','Python data structures',NULL,'video',NULL,'local',NULL,NULL,2,'2025-11-29 16:49:46','2025-11-29 16:49:46'),(6,2,'Search Algorithms','Uninformed Search',NULL,'video',NULL,'local',NULL,NULL,3,'2025-11-29 16:49:46','2025-11-29 16:49:46'),(7,2,'Informed Search','Heuristics',NULL,'video',NULL,'local',NULL,NULL,4,'2025-11-29 16:49:46','2025-11-29 16:49:46'),(8,2,'Logic & Propositional Knowledge','Propositional logic',NULL,'video',NULL,'local',NULL,NULL,5,'2025-11-29 16:49:46','2025-11-29 16:49:46'),(9,2,'First-Order Logic','Predicates',NULL,'video',NULL,'local',NULL,NULL,6,'2025-11-29 16:49:46','2025-11-29 16:49:46');
/*!40000 ALTER TABLE `lessons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `live_attendance`
--

DROP TABLE IF EXISTS `live_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `live_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `live_session_id` int NOT NULL,
  `user_id` int NOT NULL,
  `joined_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `left_at` datetime DEFAULT NULL,
  `duration_minutes` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `live_session_id` (`live_session_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `live_attendance_ibfk_1` FOREIGN KEY (`live_session_id`) REFERENCES `live_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `live_attendance_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `live_attendance`
--

LOCK TABLES `live_attendance` WRITE;
/*!40000 ALTER TABLE `live_attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `live_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `live_sessions`
--

DROP TABLE IF EXISTS `live_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `live_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lesson_id` int NOT NULL,
  `course_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `stream_key` varchar(255) NOT NULL,
  `stream_url` varchar(255) DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `max_participants` int DEFAULT '0',
  `status` enum('scheduled','live','ended','cancelled') DEFAULT 'scheduled',
  `recording_path` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stream_key` (`stream_key`),
  KEY `lesson_id` (`lesson_id`),
  KEY `course_id` (`course_id`),
  KEY `vendor_id` (`vendor_id`),
  CONSTRAINT `live_sessions_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `live_sessions_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `live_sessions_ibfk_3` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `live_sessions`
--

LOCK TABLES `live_sessions` WRITE;
/*!40000 ALTER TABLE `live_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `live_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media_files`
--

DROP TABLE IF EXISTS `media_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mediable_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `mediable_id` int DEFAULT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_type` enum('image','video') DEFAULT 'image',
  `storage_type` enum('local','s3','cdn') DEFAULT 'local',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media_files`
--

LOCK TABLES `media_files` WRITE;
/*!40000 ALTER TABLE `media_files` DISABLE KEYS */;
INSERT INTO `media_files` VALUES (1,'course',1,'1764349731789_9CA29BC40B09.jpg','image','local','2025-11-28 17:08:51'),(2,'lesson',1,'1764349731808_B9993732F3EF.mp4','video','local','2025-11-28 17:08:51'),(3,'lesson',2,'1764349731834_F14E68247132.mp4','video','local','2025-11-28 17:08:51'),(4,'lesson',3,'1764349731865_AB47D76BE497.mp4','video','local','2025-11-28 17:08:51'),(5,'course',2,'1764434986655_381F180C91AC.jpg','image','local','2025-11-29 16:49:46'),(6,'lesson',4,'1764434986669_5F555095F443.mp4','video','local','2025-11-29 16:49:46'),(7,'lesson',5,'1764434986688_90CA41AF5056.mp4','video','local','2025-11-29 16:49:46'),(8,'lesson',6,'1764434986697_FFB5D1F12B23.mp4','video','local','2025-11-29 16:49:46'),(9,'lesson',7,'1764434986707_AD2D243D66D3.mp4','video','local','2025-11-29 16:49:46'),(10,'lesson',8,'1764434986752_750CBC5A9E05.mp4','video','local','2025-11-29 16:49:46'),(11,'lesson',9,'1764434986765_C8BD49312F35.mp4','video','local','2025-11-29 16:49:46');
/*!40000 ALTER TABLE `media_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `course_ids` text,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` tinyint NOT NULL DEFAULT '0',
  `trx_id` varchar(100) DEFAULT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `information` varchar(255) DEFAULT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userIndex` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,'[2]',99.00,1,'TRX9092433019716',1,NULL,NULL,NULL,'2026-01-22 14:33:53','2026-01-22 14:34:35');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_attempts`
--

DROP TABLE IF EXISTS `quiz_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quiz_id` int NOT NULL,
  `user_id` int NOT NULL,
  `score` int DEFAULT '0',
  `started_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `status` enum('in_progress','completed') DEFAULT 'in_progress',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_attempts`
--

LOCK TABLES `quiz_attempts` WRITE;
/*!40000 ALTER TABLE `quiz_attempts` DISABLE KEYS */;
/*!40000 ALTER TABLE `quiz_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_questions`
--

DROP TABLE IF EXISTS `quiz_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quiz_id` int NOT NULL,
  `question_text` text NOT NULL,
  `question_type` enum('mcq','written') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'mcq',
  `marks` int DEFAULT '1',
  `options` text,
  `correct_answer` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `quiz_id` (`quiz_id`),
  CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_questions`
--

LOCK TABLES `quiz_questions` WRITE;
/*!40000 ALTER TABLE `quiz_questions` DISABLE KEYS */;
INSERT INTO `quiz_questions` VALUES (1,1,'Which keyword is used to declare a variable in JavaScript?','mcq',1,'[\"let\",\"variable\",\"$\",\"#\"]',NULL,'2025-11-28 17:08:51','2025-11-28 17:08:51'),(2,1,'What is the output of console.log(typeof 123)?','mcq',1,'[\"Number\",\"String\",\"Object\",\"Array\"]',NULL,'2025-11-28 17:08:51','2025-11-28 17:08:51'),(3,1,'Which symbol is used for comments in JavaScript?','mcq',1,'[\"//\",\"<!-- -->\",\"#\",\"**\"]',NULL,'2025-11-28 17:08:51','2025-11-28 17:08:51');
/*!40000 ALTER TABLE `quiz_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizzes`
--

DROP TABLE IF EXISTS `quizzes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quizzes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lesson_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `total_marks` int DEFAULT '0',
  `passing_marks` int DEFAULT '0',
  `duration_minutes` int DEFAULT '0',
  `status` enum('draft','published') DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lesson_id` (`lesson_id`),
  CONSTRAINT `quizzes_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizzes`
--

LOCK TABLES `quizzes` WRITE;
/*!40000 ALTER TABLE `quizzes` DISABLE KEYS */;
INSERT INTO `quizzes` VALUES (1,3,'JavaScript Basics Quiz','Check your understanding of variables, data types, functions, and basic JavaScript syntax.',3,2,3,'published','2025-11-28 17:08:51','2025-11-28 17:08:51');
/*!40000 ALTER TABLE `quizzes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `site_name` varchar(255) NOT NULL DEFAULT 'My LMS',
  `site_logo` varchar(255) DEFAULT NULL,
  `site_favicon` varchar(255) DEFAULT NULL,
  `storage_type` enum('local','s3','cdn') NOT NULL DEFAULT 'local',
  `site_email` varchar(100) DEFAULT NULL,
  `site_phone` varchar(50) DEFAULT NULL,
  `site_address` varchar(255) DEFAULT NULL,
  `base_currency` varchar(10) DEFAULT 'BDT',
  `currency_symbol` varchar(10) DEFAULT '৳',
  `site_charge` decimal(10,2) DEFAULT '15.00',
  `currency_position` enum('left','right') DEFAULT 'right',
  `has_space` tinyint(1) DEFAULT NULL,
  `email_notifications` enum('enabled','disabled') DEFAULT 'enabled',
  `sms_notifications` enum('enabled','disabled') DEFAULT 'enabled',
  `in_app_notification` enum('enabled','disabled') DEFAULT 'enabled',
  `firebase_notification` enum('enabled','disabled') DEFAULT 'enabled',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'AcademicX','1764516879027_F881F664F061.png','1764516970629_82C9A0119A7E.png','local','academix@gmail.com','01795909700','Dhaka','USD','$',15.00,'right',1,'enabled','enabled','enabled','enabled');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_courses`
--

DROP TABLE IF EXISTS `student_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_courses` (
  `course_id` int unsigned NOT NULL,
  `student_id` int unsigned NOT NULL,
  KEY `student_course_index_id` (`course_id`),
  KEY `student_id_index` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_courses`
--

LOCK TABLES `student_courses` WRITE;
/*!40000 ALTER TABLE `student_courses` DISABLE KEYS */;
INSERT INTO `student_courses` VALUES (2,1);
/*!40000 ALTER TABLE `student_courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `driver` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive','banned') DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Demo Student','demostudent@gmail.com','$2b$10$R8PS/Rml1I.e9yNGzSZTwu2ZM98a9SqOq3UTUB3eritONES4fOoCG',NULL,NULL,'active','2025-11-26 19:53:13','2025-11-26 19:53:13');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ownername` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `company_name` varchar(150) NOT NULL,
  `bio` text,
  `website` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `driver` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `verification_status` enum('pending','approved','rejected','blocked') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `balance` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

LOCK TABLES `vendors` WRITE;
/*!40000 ALTER TABLE `vendors` DISABLE KEYS */;
INSERT INTO `vendors` VALUES (1,'Demo Vendor','demovendor@gmail.com','Demo Company','Company Demo Bio','https://demo.com','01795909700','Dhaka',NULL,NULL,'$2a$12$DnqDlFnq.gKeH5hXNVcYG.QNJFrtjI8CH77TUPQ9e4Xtx7lm/cjc2','approved','2025-11-02 20:46:53','2026-01-22 20:41:08',84.15);
/*!40000 ALTER TABLE `vendors` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-22 20:47:23
