const vietnameseSidebar = [
  {
    text: "Kiến trúc high concurrency",
    collapsed: true,
    items: [
      {
        text: "Message queue",
        link: "/vi/high-concurrency/mq-interview.md",
        collapsed: true,
        items: [
          {
            text: "Tại sao cần dùng message queue?",
            link: "/vi/high-concurrency/why-mq.md",
          },
          {
            text: "Làm thế nào đảm bảo tính high availability của message queue?",
            link: "/vi/high-concurrency/how-to-ensure-high-availability-of-message-queues.md",
          },
          {
            text: "Làm thế nào đảm bảo message không bị tiêu thụ lặp lại?",
            link: "/vi/high-concurrency/how-to-ensure-that-messages-are-not-repeatedly-consumed.md",
          },
          {
            text: "Làm thế nào đảm bảo truyền message đáng tin cậy?",
            link: "/vi/high-concurrency/how-to-ensure-the-reliable-transmission-of-messages.md",
          },
          {
            text: "Làm thế nào đảm bảo thứ tự của message?",
            link: "/vi/high-concurrency/how-to-ensure-the-order-of-messages.md",
          },
          {
            text: "Làm thế nào giải quyết vấn đề message queue bị trễ và hết hạn?",
            link: "/vi/high-concurrency/mq-time-delay-and-expired-failure.md",
          },
          {
            text: "Thiết kế một message queue như thế nào?",
            link: "/vi/high-concurrency/mq-design.md",
          },
        ],
      },
      {
        text: "Search engine",
        collapsed: true,
        link: "/vi/high-concurrency/es-introduction.md",
        items: [
          {
            text: "Nguyên lý kiến trúc phân tán của ES",
            link: "/vi/high-concurrency/es-architecture.md",
          },
          {
            text: "Nguyên lý ghi dữ liệu của ES",
            link: "/vi/high-concurrency/es-write-query-search.md",
          },
          {
            text: "Tối ưu hiệu năng truy vấn ES",
            link: "/vi/high-concurrency/es-optimizing-query-performance.md",
          },
          {
            text: "Kiến trúc cụm ES production",
            link: "/vi/high-concurrency/es-production-cluster.md",
          },
        ],
      },
      {
        text: "Cache",
        collapsed: true,
        items: [
          {
            text: "Cách sử dụng cache",
            link: "/vi/high-concurrency/why-cache.md",
          },
          {
            text: "Sự khác nhau giữa Redis và Memcached",
            link: "/vi/high-concurrency/redis-single-thread-model.md",
          },
          {
            text: "Các kiểu dữ liệu Redis và tình huống sử dụng",
            link: "/vi/high-concurrency/redis-data-types.md",
          },
          {
            text: "Chính sách hết hạn và thuật toán LRU của Redis",
            link: "/vi/high-concurrency/redis-expiration-policies-and-lru.md",
          },
          {
            text: "Redis high concurrency và high availability",
            link: "/vi/high-concurrency/how-to-ensure-high-concurrency-and-high-availability-of-redis.md",
          },
          {
            text: "Kiến trúc Redis primary-replica",
            link: "/vi/high-concurrency/redis-master-slave.md",
          },
          {
            text: "Cơ chế persistence của Redis",
            link: "/vi/high-concurrency/redis-persistence.md",
          },
          {
            text: "Triển khai high availability bằng Redis Sentinel",
            link: "/vi/high-concurrency/redis-sentinel.md",
          },
          {
            text: "Nguyên lý chế độ Redis cluster",
            link: "/vi/high-concurrency/redis-cluster.md",
          },
          {
            text: "Cache avalanche, penetration và breakdown",
            link: "/vi/high-concurrency/redis-caching-avalanche-and-caching-penetration.md",
          },
          {
            text: "Vấn đề nhất quán giữa cache và database",
            link: "/vi/high-concurrency/redis-consistence.md",
          },
          {
            text: "Vấn đề cạnh tranh đồng thời trong Redis",
            link: "/vi/high-concurrency/redis-cas.md",
          },
          {
            text: "Phương án triển khai Redis trên production",
            link: "/vi/high-concurrency/redis-production-environment.md",
          },
        ],
      },
      {
        text: "Sharding database/table",
        collapsed: true,
        items: [
          {
            text: "Vì sao cần sharding database/table?",
            link: "/vi/high-concurrency/database-shard.md",
          },
          {
            text: "Làm thế nào chuyển đổi sharding database/table một cách êm ái?",
            link: "/vi/high-concurrency/database-shard-method.md",
          },
          {
            text: "Phương án mở rộng và thu hẹp quy mô động",
            link: "/vi/high-concurrency/database-shard-dynamic-expand.md",
          },
          {
            text: "Xử lý khóa chính ID như thế nào?",
            link: "/vi/high-concurrency/database-shard-global-id-generate.md",
          },
        ],
      },
      {
        text: "Read/write separation",
        items: [
          {
            text: "Làm thế nào triển khai read/write separation?",
            link: "/vi/high-concurrency/mysql-read-write-separation.md",
          },
        ],
      },
      {
        text: "Hệ thống high concurrency",
        items: [
          {
            text: "Thiết kế một hệ thống high concurrency như thế nào?",
            link: "/vi/high-concurrency/high-concurrency-design.md",
          },
        ],
      },
      {
        text: "Rate limiting",
        items: [
          {
            text: "Cách triển khai rate limiting",
            link: "/vi/high-concurrency/how-to-limit-current.md",
          },
        ],
      },
    ],
  },
  {
    text: "Hệ thống phân tán",
    collapsed: true,
    items: [
      {
        text: "Chuỗi câu hỏi phỏng vấn liên hoàn",
        link: "/vi/distributed-system/distributed-system-interview.md",
      },
      {
        text: "Tách hệ thống",
        items: [
          {
            text: "Vì sao cần tách hệ thống?",
            link: "/vi/distributed-system/why-dubbo.md",
          },
        ],
      },
      {
        text: "Framework dịch vụ phân tán",
        collapsed: true,
        items: [
          {
            text: "Nguyên lý hoạt động của Dubbo",
            link: "/vi/distributed-system/dubbo-operating-principle.md",
          },
          {
            text: "Giao thức tuần tự hóa của Dubbo",
            link: "/vi/distributed-system/dubbo-serialization-protocol.md",
          },
          {
            text: "Chiến lược cân bằng tải và chịu lỗi cụm của Dubbo",
            link: "/vi/distributed-system/dubbo-load-balancing.md",
          },
          {
            text: "Cơ chế SPI của Dubbo",
            link: "/vi/distributed-system/dubbo-spi.md",
          },
          {
            text: "Quản trị dịch vụ dựa trên Dubbo như thế nào?",
            link: "/vi/distributed-system/dubbo-service-management.md",
          },
          {
            text: "Thiết kế tính idempotency cho giao diện dịch vụ phân tán như thế nào?",
            link: "/vi/distributed-system/distributed-system-idempotency.md",
          },
          {
            text: "Làm thế nào để bảo đảm thứ tự yêu cầu của giao diện dịch vụ phân tán?",
            link: "/vi/distributed-system/distributed-system-request-sequence.md",
          },
          {
            text: "Thiết kế một khung RPC tương tự Dubbo",
            link: "/vi/distributed-system/dubbo-rpc-design.md",
          },
          {
            text: "P trong định lý CAP là gì?",
            link: "/vi/distributed-system/distributed-system-cap.md",
          },
        ],
      },
      {
        text: "Distributed lock",
        collapsed: true,
        items: [
          {
            text: "Các tình huống sử dụng Zookeeper",
            link: "/vi/distributed-system/zookeeper-application-scenarios.md",
          },
          {
            text: "Redis vs Zookeeper triển khai khóa phân tán",
            link: "/vi/distributed-system/distributed-lock-redis-vs-zookeeper.md",
          },
        ],
      },
      {
        text: "Giao dịch phân tán",
        items: [
          {
            text: "Nguyên lý giao dịch phân tán",
            link: "/vi/distributed-system/distributed-transaction.md",
          },
        ],
      },
      {
        text: "Session phân tán",
        items: [
          {
            text: "Làm thế nào để triển khai Session phân tán?",
            link: "/vi/distributed-system/distributed-session.md",
          },
        ],
      },
    ],
  },
  {
    text: "Kiến trúc high availability",
    collapsed: true,
    items: [
      {
        text: "High availability với Hystrix",
        collapsed: true,
        items: [
          {
            text: "Giới thiệu Hystrix",
            link: "/vi/high-availability/hystrix-introduction.md",
          },
          {
            text: "Thiết kế kiến trúc trang chi tiết sản phẩm",
            link: "/vi/high-availability/e-commerce-website-detail-page-architecture.md",
          },
          {
            text: "Thread pool isolation",
            link: "/vi/high-availability/hystrix-thread-pool-isolation.md",
          },
          {
            text: "Semaphore isolation",
            link: "/vi/high-availability/hystrix-semphore-isolation.md",
          },
          {
            text: "Chiến lược isolation chi tiết",
            link: "/vi/high-availability/hystrix-execution-isolation.md",
          },
          {
            text: "Nguyên lý thực thi",
            link: "/vi/high-availability/hystrix-process.md",
          },
          {
            text: "Cache Request Cache",
            link: "/vi/high-availability/hystrix-request-cache.md",
          },
          {
            text: "Cache degradation cục bộ",
            link: "/vi/high-availability/hystrix-fallback.md",
          },
          {
            text: "Nguyên lý circuit breaker",
            link: "/vi/high-availability/hystrix-circuit-breaker.md",
          },
          {
            text: "Rate limiting và thread pool isolation",
            link: "/vi/high-availability/hystrix-thread-pool-current-limiting.md",
          },
          {
            text: "Cơ chế bảo vệ timeout",
            link: "/vi/high-availability/hystrix-timeout.md",
          },
        ],
      },
      {
        text: "Circuit breaker và degradation",
        items: [
          {
            text: "Sentinel vs Hystrix",
            link: "/vi/high-availability/sentinel-vs-hystrix.md",
          },
        ],
      },
    ],
  },
  {
    text: "Kiến trúc microservice",
    collapsed: true,
    items: [
      {
        text: "Khái niệm microservice",
        collapsed: true,
        items: [
          {
            text: "Mô tả về kiến trúc microservice",
            link: "/vi/micro-services/microservices-introduction.md",
          },
          {
            text: "Từ monolith đến microservice",
            link: "/vi/micro-services/migrating-from-a-monolithic-architecture-to-a-microservices-architecture.md",
          },
          {
            text: "Quản lý dữ liệu hướng sự kiện",
            link: "/vi/micro-services/event-driven-data-management-for-microservices.md",
          },
          {
            text: "Lựa chọn chiến lược triển khai",
            link: "/vi/micro-services/choose-microservice-deployment-strategy.md",
          },
        ],
      },
      {
        text: "Kiến trúc Spring Cloud",
        collapsed: true,
        items: [
          {
            text: "Cơ chế giao tiếp giữa các microservice",
            link: "/vi/micro-services/what's-microservice-how-to-communicate.md",
          },
          {
            text: "Công nghệ cho microservice",
            link: "/vi/micro-services/micro-services-technology-stack.md",
          },
          {
            text: "Chiến lược quản trị microservice",
            link: "/vi/micro-services/micro-service-governance.md",
          },
          {
            text: "Đăng ký và khám phá dịch vụ Eureka",
            link: "/vi/micro-services/how-eureka-enable-service-discovery-and-service-registration.md",
          },
        ],
      },
    ],
  },
  {
    text: "Xử lý dữ liệu lớn",
    collapsed: true,
    items: [
      { text: "Tìm các URL trùng nhau", link: "/vi/big-data/find-common-urls.md" },
      { text: "Tìm các từ xuất hiện thường xuyên", link: "/vi/big-data/find-top-100-words.md" },
      { text: "Tìm IP được truy cập nhiều nhất", link: "/vi/big-data/find-top-1-ip.md" },
      {
        text: "Tìm các số nguyên không lặp lại",
        link: "/vi/big-data/find-no-repeat-number.md",
      },
      {
        text: "Kiểm tra một số có tồn tại",
        link: "/vi/big-data/find-a-number-if-exists.md",
      },
      {
        text: "Tìm chuỗi truy vấn phổ biến nhất",
        link: "/vi/big-data/find-hotest-query-string.md",
      },
      {
        text: "Đếm số lượng số điện thoại khác nhau",
        link: "/vi/big-data/count-different-phone-numbers.md",
      },
      {
        text: "Tìm trung vị",
        link: "/vi/big-data/find-mid-value-in-500-millions.md",
      },
      {
        text: "Sắp xếp query theo tần suất",
        link: "/vi/big-data/sort-the-query-strings-by-counts.md",
      },
      {
        text: "Tìm 500 số đứng đầu",
        link: "/vi/big-data/find-rank-top-500-numbers.md",
      },
    ],
  },
];

export const locales = {
  root: {
    label: "中文",
    lang: "zh-CN",
  },
  vi: {
    label: "Tiếng Việt",
    lang: "vi-VN",
    link: "/vi/",
    themeConfig: {
      nav: [
        { text: "Trang chủ", link: "/vi/" },
        {
          text: "Kiến trúc high concurrency",
          link: "/vi/high-concurrency/mq-interview.md",
        },
        {
          text: "Hệ thống phân tán",
          link: "/vi/distributed-system/distributed-system-interview.md",
        },
        {
          text: "Kiến trúc high availability",
          link: "/vi/high-availability/hystrix-introduction.md",
        },
        {
          text: "Kiến trúc microservice",
          link: "/vi/micro-services/microservices-introduction.md",
        },
        {
          text: "Xử lý dữ liệu lớn",
          link: "/vi/big-data/find-common-urls.md",
        },
      ],
      sidebar: vietnameseSidebar,
      outline: { label: "Mục lục" },
      docFooter: {
        prev: "Trang trước",
        next: "Trang sau",
      },
      lastUpdated: { text: "Cập nhật lần cuối" },
      editLink: {
        pattern: "https://github.com/doocs/advanced-java/edit/main/docs/:path",
        text: "Chỉnh sửa trang này trên GitHub",
      },
      footer: {
        message: "Phát hành theo giấy phép CC-BY-SA-4.0.",
        copyright: "Bản quyền © 2018-nay <a href=\"https://github.com/doocs\">Doocs</a>",
      },
      darkModeSwitchLabel: "Giao diện",
      lightModeSwitchTitle: "Chuyển sang giao diện sáng",
      darkModeSwitchTitle: "Chuyển sang giao diện tối",
      sidebarMenuLabel: "Thanh bên",
      returnToTopLabel: "Về đầu trang",
      langMenuLabel: "Đổi ngôn ngữ",
      navMenuLabel: "Điều hướng chính",
      mobileMenuLabel: "Menu",
      extraMenuLabel: "Tùy chọn khác",
      skipToContentLabel: "Chuyển đến nội dung",
      notFound: { title: "Trang không tồn tại" },
    },
  },
};
