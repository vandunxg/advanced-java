# Làm thế nào để triển khai Session phân tán?

## Câu hỏi phỏng vấn

Khi triển khai theo cụm, làm thế nào để Session hoạt động phân tán?

## Phân tích góc nhìn của người phỏng vấn

Người phỏng vấn đã hỏi bạn rất nhiều về cách dùng Dubbo. Nếu biết dùng Dubbo, bạn có thể chuyển hệ thống đơn khối thành hệ thống phân tán; sau đó sẽ lần lượt xuất hiện hàng loạt vấn đề, lớn nhất là **giao dịch phân tán**, **tính idempotent của interface**, **khóa phân tán**, và vấn đề cuối cùng là **Session phân tán**.

Tất nhiên, các vấn đề trong hệ thống phân tán còn nhiều hơn thế, rất đa dạng và phức tạp. Ở đây chỉ nói đến một số vấn đề thường gặp, cũng là những vấn đề thường được hỏi khi phỏng vấn.

## Phân tích câu hỏi phỏng vấn

Session là gì? Trình duyệt có Cookie; Cookie này tồn tại trong một khoảng thời gian. Mỗi lần gửi yêu cầu, trình duyệt đều gửi kèm một `jsessionid cookie` đặc biệt. Dựa vào đó, máy chủ duy trì một phạm vi Session tương ứng để lưu một số dữ liệu.

Thông thường, nếu bạn chưa đóng trình duyệt và Cookie vẫn còn thì Session tương ứng cũng còn; nếu Cookie mất thì Session cũng mất. Session thường được dùng cho những thứ như giỏ hàng và lưu trạng thái đăng nhập.

Không nói nhiều về điều này; ai biết Java cũng đều phải biết.

Session hoạt động như vậy không có vấn đề gì trong hệ thống đơn khối, nhưng còn hệ thống phân tán với nhiều dịch vụ thì sao? Trạng thái Session được duy trì ở đâu?

Thực ra có nhiều cách, nhưng một số cách thường gặp và được sử dụng phổ biến gồm:

### Hoàn toàn không dùng Session

Dùng JWT Token để lưu danh tính người dùng, sau đó lấy thông tin khác từ cơ sở dữ liệu hoặc cache. Như vậy, yêu cầu được chuyển đến máy chủ nào cũng không thành vấn đề.

### Tomcat + Redis

Cách này khá thuận tiện: mã sử dụng Session vẫn giống như trước, tiếp tục dựa trên cơ chế hỗ trợ Session nguyên bản của Tomcat; sau đó dùng thành phần có tên `Tomcat RedisSessionManager` để mọi Tomcat được triển khai đều lưu dữ liệu Session vào Redis.

Cấu hình trong tệp cấu hình Tomcat:

```xml
<Valve className="com.orangefunction.tomcat.redissessions.RedisSessionHandlerValve" />

<Manager className="com.orangefunction.tomcat.redissessions.RedisSessionManager"
         host="{redis.host}"
         port="{redis.port}"
         database="{redis.dbnum}"
         maxInactiveInterval="60"/>
```

Sau đó chỉ cần chỉ định host và port của Redis là được.

```xml
<Valve className="com.orangefunction.tomcat.redissessions.RedisSessionHandlerValve" />
<Manager className="com.orangefunction.tomcat.redissessions.RedisSessionManager"
	 sentinelMaster="mymaster"
	 sentinels="<sentinel1-ip>:26379,<sentinel2-ip>:26379,<sentinel3-ip>:26379"
	 maxInactiveInterval="60"/>
```

Cũng có thể dùng cách trên để lưu dữ liệu Session dựa trên cụm Redis high availability được Redis Sentinel hỗ trợ; đều được.

### Spring Session + Redis

Cách thứ hai nói ở trên gắn chặt với container Tomcat. Nếu muốn chuyển container Web sang Jetty thì chẳng lẽ phải cấu hình lại toàn bộ Jetty?

Cách Tomcat + Redis ở trên dễ dùng nhưng **phụ thuộc rất nhiều vào container Web**, khiến việc chuyển mã sang các container Web khác trở nên khó khăn. Đặc biệt, nếu bạn thay đổi stack công nghệ thì sao? Chẳng hạn chuyển sang Spring Cloud hoặc Spring Boot?

Vì vậy, hiện nay lựa chọn tốt hơn là giải pháp trọn gói cho Java, tức Spring. Spring về cơ bản cung cấp phần lớn các framework chúng ta cần dùng: dùng Spring Cloud để xây dựng microservice, dùng Spring Boot làm bộ khung ứng dụng, vì thế Spring Session là một lựa chọn tốt.

Cấu hình trong pom.xml:

```xml
<dependency>
  <groupId>org.springframework.session</groupId>
  <artifactId>spring-session-data-redis</artifactId>
  <version>1.2.1.RELEASE</version>
</dependency>
<dependency>
  <groupId>redis.clients</groupId>
  <artifactId>jedis</artifactId>
  <version>2.8.1</version>
</dependency>
```

Cấu hình trong tệp cấu hình Spring:

```xml
<bean id="redisHttpSessionConfiguration"
     class="org.springframework.session.data.redis.config.annotation.web.http.RedisHttpSessionConfiguration">
    <property name="maxInactiveIntervalInSeconds" value="600"/>
</bean>

<bean id="jedisPoolConfig" class="redis.clients.jedis.JedisPoolConfig">
    <property name="maxTotal" value="100" />
    <property name="maxIdle" value="10" />
</bean>

<bean id="jedisConnectionFactory"
      class="org.springframework.data.redis.connection.jedis.JedisConnectionFactory" destroy-method="destroy">
    <property name="hostName" value="${redis_hostname}"/>
    <property name="port" value="${redis_port}"/>
    <property name="password" value="${redis_pwd}" />
    <property name="timeout" value="3000"/>
    <property name="usePool" value="true"/>
    <property name="poolConfig" ref="jedisPoolConfig"/>
</bean>
```

Cấu hình trong web.xml:

```xml
<filter>
    <filter-name>springSessionRepositoryFilter</filter-name>
    <filter-class>org.springframework.web.filter.DelegatingFilterProxy</filter-class>
</filter>
<filter-mapping>
    <filter-name>springSessionRepositoryFilter</filter-name>
    <url-pattern>/*</url-pattern>
</filter-mapping>
```

Mã ví dụ:

```java
@RestController
@RequestMapping("/test")
public class TestController {

    @RequestMapping("/putIntoSession")
    public String putIntoSession(HttpServletRequest request, String username) {
        request.getSession().setAttribute("name",  "leo");
        return "ok";
    }

    @RequestMapping("/getFromSession")
    public String getFromSession(HttpServletRequest request, Model model){
        String name = request.getSession().getAttribute("name");
        return name;
    }
}
```

Đoạn mã trên là ổn: cấu hình Spring Session dựa trên Redis để lưu dữ liệu Session, rồi cấu hình một filter của Spring Session để mọi thao tác liên quan đến Session do Spring Session quản lý. Sau đó, trong mã vẫn dùng các thao tác Session nguyên bản; dữ liệu được lấy từ Redis thông qua Spring Session.

Có nhiều cách triển khai Session phân tán. Tôi chỉ nêu một số cách tương đối phổ biến: Tomcat + Redis trước đây thường được sử dụng nhưng gắn chặt với Tomcat; những năm gần đây, người ta triển khai thông qua Spring Session.
