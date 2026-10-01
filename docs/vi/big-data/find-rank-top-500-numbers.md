# Làm thế nào để tìm 500 số đứng đầu?

## Mô tả bài toán

Có 20 mảng, mỗi mảng có 500 phần tử và được sắp xếp theo thứ tự. Làm thế nào để tìm 500 số đứng đầu trong 20\*500 số này?

## Hướng giải quyết

Với bài toán TopK, phương pháp thường dùng nhất là heap sort. Với bài toán này, giả sử các mảng được sắp xếp giảm dần, có thể dùng phương pháp sau:

Trước tiên, tạo một heap max có kích thước bằng số lượng mảng, tức 20, rồi đưa giá trị lớn nhất của mỗi mảng vào heap.

Tiếp theo, xóa phần tử ở đỉnh heap và lưu vào một mảng khác có kích thước 500, sau đó chèn vào heap max phần tử kế tiếp trong mảng chứa phần tử vừa bị xóa.

Lặp lại các bước trên cho đến khi xóa phần tử thứ 500; khi đó đã tìm được 500 số lớn nhất.

> Để sau khi lấy một giá trị khỏi heap có thể biết giá trị đó được lấy từ mảng nào, rồi lấy giá trị tiếp theo từ mảng đó, có thể lưu con trỏ đến mảng trong heap và cung cấp cho con trỏ này phương thức so sánh.

```java
import lombok.Data;

import java.util.Arrays;
import java.util.PriorityQueue;

/**
 * @author https://github.com/yanglbme
 */
@Data
public class DataWithSource implements Comparable<DataWithSource> {
    /**
     * Giá trị
     */
    private int value;

    /**
     * Mảng ghi lại nguồn của giá trị
     */
    private int source;

    /**
     * Chỉ số của giá trị trong mảng
     */
    private int index;

    public DataWithSource(int value, int source, int index) {
        this.value = value;
        this.source = source;
        this.index = index;
    }

    /**
     *
     * Vì PriorityQueue được triển khai bằng min-heap, ở đây sửa đổi
     * logic so sánh giữa hai số nguyên để biến PriorityQueue thành max-heap
     */
    @Override
    public int compareTo(DataWithSource o) {
        return Integer.compare(o.getValue(), this.value);
    }
}

class Test {
    public static int[] getTop(int[][] data) {
        int rowSize = data.length;
        int columnSize = data[0].length;

        // Tạo một mảng có kích thước columnSize để lưu kết quả
        int[] result = new int[columnSize];

        PriorityQueue<DataWithSource> maxHeap = new PriorityQueue<>();
        for (int i = 0; i < rowSize; ++i) {
            // Đưa phần tử lớn nhất trong mỗi mảng vào heap
            DataWithSource d = new DataWithSource(data[i][0], i, 0);
            maxHeap.add(d);
        }

        int num = 0;
        while (num < columnSize) {
            // Xóa phần tử ở đỉnh heap
            DataWithSource d = maxHeap.poll();
            result[num++] = d.getValue();
            if (num >= columnSize) {
                break;
            }

            d.setValue(data[d.getSource()][d.getIndex() + 1]);
            d.setIndex(d.getIndex() + 1);
            maxHeap.add(d);
        }
        return result;

    }

    public static void main(String[] args) {
        int[][] data = {
                {29, 17, 14, 2, 1},
                {19, 17, 16, 15, 6},
                {30, 25, 20, 14, 5},
        };

        int[] top = getTop(data);
        System.out.println(Arrays.toString(top)); // [30, 29, 25, 20, 19]
    }
}
```

## Tổng kết phương pháp

Khi tìm TopK, hãy cân nhắc heap sort xem sao?
