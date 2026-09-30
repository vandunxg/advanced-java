# Microservice là gì? Các microservice giao tiếp độc lập với nhau như thế nào?

## Microservice là gì?

-   Kiến trúc microservice là một hệ thống phân tán, chia theo nghiệp vụ thành các đơn vị dịch vụ khác nhau để giải quyết những hạn chế của hệ thống đơn khối như vấn đề hiệu năng.
-   Microservice là một phong cách kiến trúc, trong đó một ứng dụng phần mềm lớn gồm nhiều đơn vị dịch vụ. Các đơn vị dịch vụ trong hệ thống có thể triển khai độc lập và liên kết lỏng với nhau.

> Nguồn gốc khái niệm microservice: [Microservices](https://martinfowler.com/articles/microservices.html)

## Các microservice giao tiếp độc lập với nhau như thế nào?

### Đồng bộ

#### Giao thức REST HTTP

Yêu cầu REST là một trong những cách giao tiếp phổ biến nhất trong microservice; nó dựa trên giao thức HTTP\\HTTPS. Đặc điểm của RESTful là:

1. Mỗi URI đại diện cho một loại tài nguyên.
2. Client dùng bốn động từ GET, POST, PUT, DELETE để biểu thị cách thao tác tài nguyên phía server: GET dùng để lấy tài nguyên, POST dùng để tạo tài nguyên mới (cũng có thể dùng để cập nhật), PUT dùng để cập nhật tài nguyên, DELETE dùng để xóa tài nguyên.
3. Thao tác với tài nguyên thông qua biểu diễn của tài nguyên đó.
4. Biểu diễn tài nguyên là XML hoặc HTML.
5. Tương tác giữa client và server không trạng thái giữa các yêu cầu: mỗi yêu cầu từ client đến server phải chứa thông tin cần thiết để hiểu yêu cầu.

Ví dụ, phía dịch vụ cung cấp giao diện sau:

```java
@RestController
@RequestMapping("/communication")
public class RestControllerDemo {
    @GetMapping("/hello")
    public String s() {
        return "hello";
    }
}
```

Một dịch vụ khác cần gọi giao diện này; bên gọi chỉ cần gửi yêu cầu dựa trên tài liệu API là có thể nhận kết quả trả về.

```java
@RestController
@RequestMapping("/demo")
public class RestDemo{
    @Autowired
    RestTemplate restTemplate;

    @GetMapping("/hello2")
    public String s2() {
        String forObject = restTemplate.getForObject("http://localhost:9013/communication/hello", String.class);
        return forObject;
    }
}
```

Có thể dùng cách này để giao tiếp giữa các dịch vụ.

#### Giao thức RPC TCP

RPC (Remote Procedure Call, lời gọi thủ tục từ xa) có thể hiểu đơn giản là một nút yêu cầu dịch vụ do nút khác cung cấp. Quy trình hoạt động như sau:

1. Thực thi câu lệnh gọi phía client và truyền tham số.
2. Gọi hệ thống cục bộ để gửi thông điệp mạng.
3. Thông điệp được truyền đến máy chủ từ xa.
4. Server nhận thông điệp và lấy các tham số.
5. Thực thi thủ tục từ xa (dịch vụ) dựa trên yêu cầu gọi và tham số.
6. Sau khi thực thi xong, trả kết quả về handle của server.
7. Handle của server trả kết quả; hệ thống mạng của máy chủ từ xa gửi kết quả đi.
8. Thông điệp được truyền về máy chủ cục bộ.
9. Handle của client nhận thông điệp từ dịch vụ mạng của máy cục bộ.
10. Client nhận dữ liệu kết quả trả về từ câu lệnh gọi.

Lấy một ví dụ.

Trước tiên cần có server:

```java
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.lang.reflect.Method;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * RPC 服务端用来注册远程方法的接口和实现类
 */
public class RPCServer {
    private static ExecutorService executor = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());

    private static final ConcurrentHashMap<String, Class> serviceRegister = new ConcurrentHashMap<>();

    /**
     * 注册方法
     * @param service
     * @param impl
     */
    public void register(Class service, Class impl) {
        serviceRegister.put(service.getSimpleName(), impl);
    }

    /**
     * 启动方法
     * @param port
     */
    public void start(int port) {
        ServerSocket socket = null;
        try {
            socket = new ServerSocket();
            socket.bind(new InetSocketAddress(port));
            System.out.println("服务启动");
            System.out.println(serviceRegister);
            while (true) {
                executor.execute(new Task(socket.accept()));
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (socket != null) {
                try {
                    socket.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    private static class Task implements Runnable {
        Socket client = null;

        public Task(Socket client) {
            this.client = client;
        }

        @Override
        public void run() {
            ObjectInputStream input = null;
            ObjectOutputStream output = null;
            try {
                input = new ObjectInputStream(client.getInputStream());
                // 按照顺序读取对方写过来的内容
                String serviceName = input.readUTF();
                String methodName = input.readUTF();
                Class<?>[] parameterTypes = (Class<?>[]) input.readObject();
                Object[] arguments = (Object[]) input.readObject();
                Class serviceClass = serviceRegister.get(serviceName);
                if (serviceClass == null) {
                    throw new ClassNotFoundException(serviceName + " 没有找到!");
                }
                Method method = serviceClass.getMethod(methodName, parameterTypes);
                Object result = method.invoke(serviceClass.newInstance(), arguments);

                output = new ObjectOutputStream(client.getOutputStream());
                output.writeObject(result);
            } catch (Exception e) {
                e.printStackTrace();

            } finally {
                try {
                    // 这里就不写 output!=null才关闭这个逻辑了
                    output.close();
                    input.close();
                    client.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }

            }
        }
    }

}

```

Tiếp theo cần có client:

```java
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.net.InetSocketAddress;
import java.net.Socket;

/**
 * RPC 客户端
 */
public class RPCclient<T> {
    /**
     * 通过动态代理将参数发送过去到 RPCServer ,RPCserver 返回结果这个方法处理成为正确的实体
     */
    public static <T> T getRemoteProxyObj(final Class<T> service, final InetSocketAddress addr) {

        return (T) Proxy.newProxyInstance(service.getClassLoader(), new Class<?>[]{service}, new InvocationHandler() {
            @Override
            public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {

                Socket socket = null;
                ObjectOutputStream out = null;
                ObjectInputStream input = null;
                try {
                    socket = new Socket();
                    socket.connect(addr);

                    // 将实体类,参数,发送给远程调用方
                    out = new ObjectOutputStream(socket.getOutputStream());
                    out.writeUTF(service.getSimpleName());
                    out.writeUTF(method.getName());
                    out.writeObject(method.getParameterTypes());
                    out.writeObject(args);

                    input = new ObjectInputStream(socket.getInputStream());
                    return input.readObject();
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    out.close();
                    input.close();
                    socket.close();
                }
                return null;
            }
        });

    }

}

```

Sau đó tạo một phương thức từ xa để kiểm thử.

```java
public interface Tinterface {
    String send(String msg);
}

public class TinterfaceImpl implements Tinterface {
    @Override
    public String send(String msg) {
        return "send message " + msg;
    }
}

```

Mã kiểm thử như sau:

```java
import java.net.InetSocketAddress;


public class RunTest {
    public static void main(String[] args) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                RPCServer rpcServer = new RPCServer();
                rpcServer.register(Tinterface.class, TinterfaceImpl.class);
                rpcServer.start(10000);
            }
        }).start();
        Tinterface tinterface = RPCclient.getRemoteProxyObj(Tinterface.class, new InetSocketAddress("localhost", 10000));
        System.out.println(tinterface.send("rpc 测试用例"));

    }
}

```

Kết quả xuất ra là `send message rpc 测试用例`.

### Bất đồng bộ

#### Middleware thông điệp

Các middleware thông điệp phổ biến gồm Kafka, ActiveMQ, RabbitMQ và RocketMQ; các giao thức thường gặp gồm AMQP, MQTTP, STOMP và XMPP. Ở đây không mở rộng thêm về hàng đợi thông điệp; cách sử dụng cụ thể xin xem tài liệu chính thức.
