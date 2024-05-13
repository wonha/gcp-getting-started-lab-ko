# **Google Cloud에서 시작하는 생성 AI 활용 애플리케이션 개발 입문**

## **Hands-on 개요**

본 Hands-on에서는 [Cloud Run](https://cloud.google.com/run), [Firebase](https://firebase.google.com/)와 같이 Google Cloud의 주요 관리형 서비스를 활용하여 클라우드 네이티브 애플리케이션 개발을 경험합니다. 그리고 이 애플리케이션에 생성 AI를 사용한 지능형 기능을 추가하여 실제 서비스와 생성 AI를 결합한 사례를 배우실 수 있습니다.

다음은 이번 Hands-on에서 사용하는 주요 서비스입니다.

**Cloud Run**

- Dockerfile 및 소스 코드에서 1개의 명령으로 Cloud Run에 배포
- 개인 배포(태그를 붙인 배포)와 같은 트래픽 제어
- 여러 서비스를 Cloud Run에서 실행하고 연결

**Firebase**

- 인증(Firebase Authentication)
- NoSQL 데이터베이스(Firestore)
- 객체 저장소(Cloud Storage for Firebase)

**Vertex AI**

- 생성 AI API(Palm2 API)
- 모델 생성
- 모델 튜닝

**BigQuery (Log Analytics)**

- Log Analytics 활성화
- 로그 버킷, 로그 라우터 설정
- 애플리케이션 로그 분석

**Cloud SQL for PostgreSQL (관리형 PostgreSQL)**

- 데이터베이스 인스턴스 작성
- 애플리케이션 데이터 저장
- 생성 AI 에 필요한 확장 기능 도입(pg_vector)
- 임베딩 인덱스 검색

이번에는 다음 두 가지 애플리케이션을 구축하여 Google Cloud를 사용한 생성 AI 애플리케이션 통합을 배우겠습니다.

- 클라우드에 파일을 저장하는 웹 애플리케이션(Knowledge Drive)
- 생성 AI 기능을 담당하는 애플리케이션(GenAI App)

## **Google Cloud 프로젝트 확인**

열려 있는 Cloud Shell의 프롬프트에 `(노란색 글씨)` 형식으로 프로젝트 ID가 표시되는지 확인하십시오.

표시되는 경우 Google Cloud 프로젝트가 올바르게 인식되었습니다.

표시되지 않으면 다음 단계에 따라 Cloud Shell을 다시 열어보세요.

1. Cloud Shell을 닫습니다.
2. 위쪽 메뉴바의 프로젝트 선택 부분에서 발급된 프로젝트가 선택되었는지 확인합니다.
3. Cloud Shell을 다시 엽니다.

## **참고: Cloud Shell 연결이 끊어졌을 때?**

일정 시간 비활성 상태가 되거나 브라우저가 멈추는 등의 이유로 `Cloud Shell` 연결이 끊어질 수 있습니다.

이 경우 `다시 연결`을 클릭한 후 튜토리얼을 다시 시작하십시오.

### **1. 튜토리얼 자료가 있는 디렉토리로 이동**

```bash
cd ~/gcp-getting-started-lab-ko/appdev_with_generative_ai
```

### **2. 튜토리얼 열기**

```bash
teachme tutorial_ko.md
```

중간까지 진행했던 튜토리얼 페이지까지 `Next` 버튼을 눌러 진행하십시오.

## **환경 준비**

<walkthrough-tutorial-duration duration=10></walkthrough-tutorial-duration>

먼저 Hands-on을 진행하기 위한 환경 준비를 합니다.

다음 설정을 진행합니다.

- Google Cloud 기능(API) 활성화 설정

## **Google Cloud 환경 설정**

Google Cloud에서는 사용하려는 기능(API)마다 활성화를 해야 합니다.
여기서는 이후 Hands-on에서 사용할 기능을 미리 활성화합니다.

```bash
gcloud services enable \
 run.googleapis.com \
 artifactregistry.googleapis.com \
 cloudbuild.googleapis.com \
 firestore.googleapis.com \
 pubsub.googleapis.com \
 eventarc.googleapis.com \
 sqladmin.googleapis.com \
 aiplatform.googleapis.com \
 translate.googleapis.com \
 firebasestorage.googleapis.com
```

**GUI**: [API 라이브러리](https://console.cloud.google.com/apis/library)

<walkthrough-footnote>필요한 기능을 사용할 수 있게 되었습니다. 다음으로 Firebase 설정 방법을 배우겠습니다.</walkthrough-footnote>

## **BigQuery (Log Analytics) 설정 (로그 버킷)**

나중에 Log Analytics를 사용하여 로그를 분석합니다. 가능한 한 많은 로그를 수집하기 위해 Cloud Run의 로그를 보낼 버킷을 미리 만듭니다.

### **1. 로그 버킷 생성**

```bash
gcloud logging buckets create run-analytics-bucket \
 --location asia-northeast1 \
 --enable-analytics
```

**참고**: 최대 3분 정도 시간이 걸립니다.

### **2. 로그 싱크 생성**

```bash
gcloud logging sinks create run-analytics-sink \
 logging.googleapis.com/projects/$GOOGLE_CLOUD_PROJECT/locations/asia-northeast1/buckets/run-analytics-bucket \
 --log-filter 'logName:"run.googleapis.com"'
```

## **Firebase 프로젝트 설정**

Knowledge Drive에서는 사용자 정보를 [Firebase Authentication](https://firebase.google.com/docs/auth)에, 애플리케이션 메타데이터를 [Cloud Firestore](https://firebase.google.com/docs/firestore)에, 파일 저장 위치를 [Cloud Storage for Firebase](https://firebase.google.com/docs/storage)에 활용합니다. Firebase 기능을 활용하면 실시간성이 높은 웹 애플리케이션을 개발할 수 있습니다.

### **1. Firebase 프로젝트 활성화**

파이어베이스의 프로젝트란 구글 클라우드의 프로젝트에 파이어베이스 전용 메타데이터를 추가한 것입니다.
아래 절차를 통해 미리 작성된 구글 클라우드 프로젝트에 파이어베이스의 메타데이터 추가하겠습니다.

**GUI**에서 Firebase를 활성화합니다.

1. [Firebase 콘솔](https://console.firebase.google.com/)에 브라우저에서 접속합니다.
2. `프로젝트 만들기` `프로젝트 추가` 버튼을 클릭합니다.
3. 프로젝트 생성(1/4단계)

`프로젝트 이름 입력`에서 생성된 Google Cloud 프로젝트를 선택합니다. 다음으로 약관에 동의하고, 이용 목적 체크 표시를 하고, `계속`을 클릭합니다.

`Blaze` 요금 확인 화면이 표시되면 `확인` 버튼을 클릭합니다.

4. 프로젝트 생성(2/4단계)

`계속`을 클릭합니다.

5. 프로젝트 생성(3/3단계)

`이 프로젝트에서 Google Analytics를 활성화`를 해제하고, `Firebase 추가`를 클릭합니다.

6. `새 프로젝트가 준비되었습니다`가 표시되면 `계속`을 클릭합니다.

### **2. 애플리케이션 설정 Shortcut**

다음 명령을 실행하면 **여기에서 11단계까지 수동으로 실행하는 다양한 설정을 단축**할 수 있습니다. 생성 AI 관련 기능에 집중하여 학습하고 싶다면 이 명령을 실행하십시오. 완료까지 10분 정도 걸립니다.

명령을 실행하는 중에 진행할지 여부를 묻는 메시지가 표시되면 `yes`를 입력하여 진행하십시오.

```bash
(cd tf/; terraform init && terraform apply -var="project_id=$GOOGLE_CLOUD_PROJECT")
```

명령을 실행한 경우 **12단계**로 진행하십시오.

## **Firebase 애플리케이션 설정**

### **1. Firebase 애플리케이션 생성**

**CLI**에서 실행합니다.

```bash
firebase apps:create -P $GOOGLE_CLOUD_PROJECT WEB knowledge-drive
```

### **2. Firebase 설정을 애플리케이션에 입력**

```bash
./scripts/firebase_config.sh ./src/knowledge-drive
```

모든 NEXT_PUBLIC_FIREBASE_XXXX라는 출력의 오른쪽(=보다 뒤)에 문자열이 설정되어 있으면 성공입니다.

## **Firebase Authentication 설정**

**GUI**에서 Firebase Authentication을 활성화합니다.

1. 다음 명령으로 출력된 URL에 브라우저에서 접속합니다.

```bash
echo "https://console.firebase.google.com/project/$GOOGLE_CLOUD_PROJECT/overview?hl=en"
```

2. `Authentication` 카드를 클릭합니다.
3. `Get started` 버튼을 클릭합니다.
4. 네이티브 공급자에서 `Email/Password`를 클릭합니다.
5. 이메일/비밀번호의 `Enable`를 클릭하여 활성화합니다.
6. `Save` 버튼을 클릭합니다.
7. 이메일/비밀번호 공급자에 활성화 체크 표시가 되어 있는지 확인합니다.

## **Firestore 데이터베이스 및 보안 규칙 설정**

### **1. Firestore 데이터베이스 생성**

데이터 저장소로 사용할 Firestore를 도쿄 리전에 생성합니다.

```bash
gcloud firestore databases create --location asia-northeast1
```

### **2. Firestore를 조작하기 위한 CLI 초기화**

```bash
firebase init firestore -P $GOOGLE_CLOUD_PROJECT
```

2개의 프롬프트가 나타나지만 둘 다 `Enter`를 눌러 기본 설정을 적용합니다.

### **3. 보안 규칙 설정 파일 덮어쓰기**

**참고**: 다음 명령은 복사 및 붙여넣기로 실행하십시오.

```shell
cat << EOF > firestore.rules
rules_version = '2';
service cloud.firestore {
 match /databases/{database}/documents {
  match /users/{userId} {
   allow read: if request.auth != null
         && request.auth.uid == userId;
   match /items/{itemId} {
    allow read, write: if request.auth != null
              && request.auth.uid == userId;
   }
  }
 }
}
EOF
```

### **4. Firebase 인덱스 설정 파일 덮어쓰기**

**참고**: 다음 명령은 복사 및 붙여넣기로 실행하십시오.

```shell
cat << EOF > firestore.indexes.json
{
 "indexes": [
  {
   "collectionGroup": "items",
   "queryScope": "COLLECTION",
   "fields": [
    {
     "fieldPath": "parent",
     "order": "ASCENDING"
    },
    {
     "fieldPath": "timestamp",
     "order": "DESCENDING"
    }
   ]
  },
  {
   "collectionGroup": "items",
   "queryScope": "COLLECTION",
   "fields": [
    {
     "fieldPath": "name",
     "order": "ASCENDING"
    },
    {
     "fieldPath": "timestamp",
     "order": "DESCENDING"
    }
   ]
  }
 ],
 "fieldOverrides": []
}
EOF
```

### **5. 업데이트된 보안 규칙 및 인덱스 배포**

```bash
firebase deploy --only firestore -P $GOOGLE_CLOUD_PROJECT
```

## **Cloud Storage for Firebase 및 보안 규칙 설정**

### **1. Firebase 기본 위치 설정**

**GUI**에서 기본 위치를 설정합니다.

1. 다음 명령으로 출력된 URL에 브라우저에서 접속합니다.

```bash
echo "https://console.firebase.google.com/project/$GOOGLE_CLOUD_PROJECT/overview?hl=en"
```

2. 왼쪽 메뉴 상단의 프로젝트 개요 오른쪽의 `톱니바퀴 마크`, `프로젝트 설정` 순으로 클릭합니다.
3. `일반` 탭이 선택되어 있는지 확인합니다.
4. `기본 GCP 리소스 위치`의 연필 마크를 클릭합니다.
5. `asia-northeast1`이 선택되어 있는지 확인하고 `완료`를 클릭합니다.

### **2. Cloud Storage를 사용하기 위한 CLI 초기화**

파일 저장소로 사용할 Cloud Storage의 CLI를 설정합니다.

```bash
firebase init storage -P $GOOGLE_CLOUD_PROJECT
```

1개의 프롬프트가 나타나지만 `Enter`를 눌러 기본 설정을 적용합니다.

### **3. 보안 규칙 설정 파일 덮어쓰기**

**참고**: 다음 명령은 복사 및 붙여넣기로 실행하십시오.

```shell
cat << EOF > storage.rules
rules_version = '2';
service firebase.storage {
 match /b/{bucket}/o {
  match /files/{userId}/{itemId} {
   allow read, write: if request.auth != null
             && request.auth.uid == userId;
  }
 }
}
EOF
```

### **4. 업데이트된 보안 규칙 배포**

```bash
firebase deploy -P $GOOGLE_CLOUD_PROJECT
```

## **Knowledge Drive 배포 사전 설정**

Cloud Run에서는 다양한 방법으로 배포가 가능합니다. 여기서는 다음 방법으로 애플리케이션을 배포합니다.

- Dockerfile을 사용하여 Cloud Build에서 컨테이너 이미지를 생성합니다. 생성된 컨테이너 이미지를 Cloud Run에 배포합니다.

### **1. Docker 리포지토리(Artifact Registry) 생성**

```bash
gcloud artifacts repositories create drive-repo \
 --repository-format docker \
 --location asia-northeast1 \
 --description "Docker repository for knowledge drive"
```

### **2. 서비스 계정 생성**

기본적으로 Cloud Run에 배포된 애플리케이션은 강력한 권한을 가집니다. 최소 권한의 원칙에 따라 필요 최소한의 권한만 부여하기 위해 먼저 서비스용 계정을 생성합니다.

```bash
gcloud iam service-accounts create knowledge-drive
```

### **3. 서비스 계정에 권한 추가**

Knowledge Drive는 인증 정보 조작, Firestore 읽기 및 쓰기 권한이 필요합니다. 방금 생성한 서비스 계정에 권한을 부여합니다.

```bash
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
 --member serviceAccount:knowledge-drive@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
 --role 'roles/firebase.sdkAdminServiceAgent'
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
 --member serviceAccount:knowledge-drive@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
 --role 'roles/firebaseauth.admin'
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
 --member serviceAccount:knowledge-drive@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
 --role 'roles/iam.serviceAccountTokenCreator'
```

## **Knowledge Drive 배포**

Cloud Build에서 컨테이너 이미지를 생성하고 생성된 이미지를 Cloud Run에 배포합니다.

```bash
gcloud builds submit ./src/knowledge-drive \
 --tag asia-northeast1-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/drive-repo/knowledge-drive && \
gcloud run deploy knowledge-drive \
 --image asia-northeast1-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/drive-repo/knowledge-drive \
 --service-account knowledge-drive@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
 --allow-unauthenticated \
 --region asia-northeast1
```

**참고**: 배포 완료까지 5분 정도 걸립니다.

## **Knowledge Drive 사용**

### **1. 브라우저에서 애플리케이션에 접속**

이전 명령에서 출력된 `Service URL` 또는 `Service_URL`의 URL을 클릭하면 브라우저 탭이 열리고 채팅 애플리케이션이 시작됩니다.

### **2. 새 사용자 등록**

맨 아래의 `계정 등록`을 클릭하고 사용자 정보를 입력한 후 `등록/Register`를 클릭합니다.

등록이 잘 되면 파일 관리 화면으로 이동합니다.

### **3. 다양한 기능 사용**

- `새로 만들기` 버튼에서 새 폴더를 생성하고 로컬에 있는 파일을 업로드할 수 있습니다.
- 오른쪽 상단의 `아바타` 마크를 클릭하면 로그아웃할 수 있습니다.
- 상단의 검색창에서 파일 이름, 폴더 이름을 검색할 수 있습니다. 완전 일치 검색임에 유의하십시오.
- 폴더는 계층화할 수 있으며, 파일은 업로드 후 클릭하면 다른 탭에 표시됩니다.

### **4. 다른 계정으로 동작 확인**

로그아웃한 후 다른 계정을 생성하여 로그인해 보세요.

이전에 생성한 계정과 파일 및 폴더가 분리되어 있는 것을 확인할 수 있습니다.

## **생성 AI를 활용하여 업로드된 파일을 기반으로 답변 생성 기능(GenAI App) 추가**

Knowledge Drive에 생성 AI를 활용하여 질문 문장에 대한 답변을 반환하는 기능인 GenAI App을 추가합니다.

이번에는 GenAI App도 개별 Cloud Run 서비스로 배포하고 두 서비스를 연결하도록 합니다.

## **Cloud SQL 데이터베이스 생성 및 설정**

파일의 텍스트 데이터를 Embedding으로 변환하여 Cloud SQL for PostgreSQL에 저장하는 구성입니다.

### **1. Cloud SQL 데이터베이스 인스턴스 생성**

```bash
gcloud sql instances create pg15-pgvector-demo --database-version=POSTGRES_15 \
  --region=asia-northeast1 --cpu=1 --memory=4GB --root-password=handson
```

최대 10분 정도 걸립니다.

### **2. Cloud SQL 데이터베이스 생성**

```bash
gcloud sql databases create docs --instance=pg15-pgvector-demo
```

### **3. 데이터베이스 사용자 생성**

```bash
gcloud sql users create docs-admin \
 --instance=pg15-pgvector-demo \
 --password=handson
```

### **4. 데이터베이스에 연결**

```bash
gcloud sql connect pg15-pgvector-demo --user=docs-admin --database=docs
```

비밀번호를 묻는 메시지가 표시되면 `handson`을 입력하십시오.

데이터베이스에 연결되면 프롬프트 표시가 변경됩니다.

### **5. 벡터 검색용 확장 기능 추가**

**참고**: 다음 명령은 복사 및 붙여넣기로 실행하십시오.

```shell
CREATE EXTENSION IF NOT EXISTS vector;
```

### **6. Embedding 데이터용 테이블 생성**

**참고**: 다음 명령은 복사 및 붙여넣기로 실행하십시오.

```shell
CREATE TABLE docs_embeddings(
 document_id VARCHAR(1024) NOT NULL,
 content TEXT,
 metadata TEXT,
 user_id TEXT,
 embedding vector(768));
```

### **7. 데이터베이스 연결 끊기**

```bash
exit
```

이제 데이터베이스 준비가 완료되었습니다.

## **GenAI App 배포**

GenAI App도 컨테이너로 Cloud Run에서 실행합니다. 이 애플리케이션은 크게 다음 두 가지 기능을 가지고 있습니다.

- PDF 파일이 Cloud Storage에 배포되면 이를 트리거로 파일을 가져오고 Embedding을 생성하여 데이터베이스에 저장합니다.
- 질문 문장을 받아 답변을 생성하여 반환합니다.

### **1. 서비스 계정 생성**

이 서비스용 계정을 생성합니다.

```bash
gcloud iam service-accounts create genai-app
```

### **2. 서비스 계정에 권한 추가**

생성 AI 처리 애플리케이션은 Cloud SQL, Vertex AI와 같은 서비스에 대한 액세스 권한이 필요합니다.

```bash
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
 --member serviceAccount:genai-app@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
 --role roles/cloudsql.client
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
 --member serviceAccount:genai-app@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
 --role roles/aiplatform.user
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
 --member serviceAccount:genai-app@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
 --role roles/storage.objectUser
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
 --member=serviceAccount:genai-app@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
 --role=roles/eventarc.eventReceiver
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
 --member serviceAccount:genai-app@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
 --role roles/datastore.user
```

### **3 GenAI App 빌드 및 배포**

```bash
gcloud builds submit ./src/genai-app \
 --tag asia-northeast1-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/drive-repo/genai-app && \
gcloud run deploy genai-app \
 --image asia-northeast1-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/drive-repo/genai-app \
 --service-account genai-app@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
 --no-allow-unauthenticated \
 --set-env-vars "PJID=$GOOGLE_CLOUD_PROJECT" \
 --region asia-northeast1
```

## **Eventarc 설정**

사용자가 파일을 업로드할 때 생성 AI 앱을 호출하도록 Eventarc를 설정합니다.

### **1. 사전 준비**

```bash
SERVICE_ACCOUNT="$(gsutil kms serviceaccount -p $GOOGLE_CLOUD_PROJECT)"
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
 --member="serviceAccount:${SERVICE_ACCOUNT}" \
 --role='roles/pubsub.publisher'
gcloud run services add-iam-policy-binding genai-app \
 --member="serviceAccount:genai-app@${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com" \
 --role='roles/run.invoker' \
 --region asia-northeast1
```

### **2. Eventarc 트리거 생성**

```bash
gcloud eventarc triggers create genai-app \
 --destination-run-service=genai-app \
 --destination-run-region=asia-northeast1 \
 --location=asia-northeast1 \
 --event-filters="type=google.cloud.storage.object.v1.finalized" \
 --event-filters="bucket=$GOOGLE_CLOUD_PROJECT.appspot.com" \
 --service-account=genai-app@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
 --destination-run-path=/register_doc
```

다음과 같은 오류가 발생하면 몇 분 후 다시 명령을 실행하십시오.

```
ERROR: (gcloud.eventarc.triggers.create) FAILED_PRECONDITION: Invalid resource state for "": Permission denied while using the Eventarc Service Agent.
```

## **비동기 연동 설정**

현재 비동기 연동에는 다음 두 가지 문제가 있습니다.

- PDF 파일 처리가 10초 안에 끝나지 않으면 오류 처리되고 다시 시도됩니다.
- 다시 시도 횟수에 제한이 없어 PDF 파일 처리에 실패하면 계속 다시 시도됩니다. 즉, 리소스 비용이 계속 증가합니다.

이를 해결하기 위해 다음 설정을 진행합니다.

- PDF 파일 처리 대기 시간을 300초(5분)로 수정합니다.
- 동일한 파일 처리에 5회 실패하면 다시 시도를 중단합니다(데드 레터 토픽에 넣습니다).

### **1. 데드 레터 토픽 생성**

```bash
gcloud pubsub topics create genai-app-dead-letter
```

### **2. 데드 레터 토픽 관련 권한 설정**

```bash
PROJECT_NUMBER=$(gcloud projects describe $GOOGLE_CLOUD_PROJECT --format="value(projectNumber)")
SUBSCRIPTION=$(gcloud pubsub subscriptions list --format json | jq -r '.[].name')
gcloud pubsub topics add-iam-policy-binding genai-app-dead-letter \
 --member="serviceAccount:service-$PROJECT_NUMBER@gcp-sa-pubsub.iam.gserviceaccount.com" \
 --role="roles/pubsub.publisher"
gcloud pubsub subscriptions add-iam-policy-binding $SUBSCRIPTION \
 --member="serviceAccount:service-$PROJECT_NUMBER@gcp-sa-pubsub.iam.gserviceaccount.com" \
 --role="roles/pubsub.subscriber"
```

### **3. 데드 레터 토픽 설정 및 구독 응답 시간 수정 확인**

```bash
SUBSCRIPTION=$(gcloud pubsub subscriptions list --format json | jq -r '.[].name')
gcloud pubsub subscriptions update $SUBSCRIPTION \
 --ack-deadline 300 \
 --dead-letter-topic genai-app-dead-letter
```

## **Knowledge Drive 업데이트**

### **1. GenAI App API를 호출할 권한 부여**

```bash
gcloud run services add-iam-policy-binding genai-app \
 --member=serviceAccount:knowledge-drive@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
 --role=roles/run.invoker \
 --region asia-northeast1
```

### **2. GenAI App과의 연동 기능 추가**

GenAI App과 연동하기 위해 Knowledge Drive를 업데이트합니다.

```bash
git switch genai-app-integration
```

### **3. 연동 기능 배포**

```bash
GENAI_APP_URL=$(gcloud run services describe genai-app --region asia-northeast1 --format json | jq -r '.status.url')
gcloud builds submit ./src/knowledge-drive \
 --tag asia-northeast1-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/drive-repo/knowledge-drive && \
gcloud run deploy knowledge-drive \
 --image asia-northeast1-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/drive-repo/knowledge-drive \
 --service-account knowledge-drive@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
 --allow-unauthenticated \
 --set-env-vars "SEARCH_HOST=$GENAI_APP_URL" \
 --region asia-northeast1
```

## **연동 기능 확인**

### **1. 파일 업로드**

GenAI App은 PDF 파일을 읽어서 처리합니다.

다음 중에서 학습시키고 싶은 PDF를 로컬 PC에 다운로드하고 Knowledge Drive에서 업로드하십시오.

- [Cloud Run](https://storage.googleapis.com/genai-handson-20230929/CloudRun.pdf)
- [Cloud SQL](https://storage.googleapis.com/genai-handson-20230929/CloudSQL.pdf)
- [Cloud Storage for Firebase](https://storage.googleapis.com/genai-handson-20230929/CloudStorageforFirebase.pdf)
- [Firebase Authentication](https://storage.googleapis.com/genai-handson-20230929/FirebaseAuthentication.pdf)
- [Firestore](https://storage.googleapis.com/genai-handson-20230929/Firestore.pdf)
- [Palm API와 LangChain 연동](https://storage.googleapis.com/genai-handson-20230929/PalmAPIAndLangChain.pdf)

### **2. GenAI App에 질문**

상단 검색창 오른쪽의 아이콘을 클릭하면 파일/폴더 이름 검색과 GenAI App에 질문 기능을 전환할 수 있습니다.

GenAI App에 질문으로 전환하고 방금 업로드한 파일 정보와 관련된 질문을 던져보세요.

답변이 잘 돌아오면 성공입니다.

### **3. 다양하게 시도해 보기**

다양한 PDF를 업로드하고 답변이 어떻게 바뀌는지 시도해 보세요.

## **축하합니다!**

<walkthrough-conclusion-trophy></walkthrough-conclusion-trophy>

이것으로 생성 AI를 사용한 애플리케이션 개발 Hands-on이 완료되었습니다.

Qwiklabs로 돌아가 `랩 종료` 버튼을 클릭하여 Hands-on을 종료하십시오.
