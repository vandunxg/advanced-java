# Làm thế nào để tìm trung vị của 500 triệu số?

## Mô tả bài toán

Tìm trung vị của 500 triệu số. Sau khi sắp xếp dữ liệu, số nằm ở vị trí chính giữa là trung vị. Khi số lượng mẫu là số lẻ, trung vị là số thứ `(N+1)/2`; khi số lượng mẫu là số chẵn, trung vị là trung bình cộng của số thứ `N/2` và số thứ `1+N/2`.

## Hướng giải quyết

Nếu bài toán này không giới hạn dung lượng bộ nhớ thì có thể đọc tất cả các số vào bộ nhớ, sắp xếp rồi tìm trung vị. Tuy nhiên, độ phức tạp thời gian của các thuật toán sắp xếp tốt nhất đều là `O(NlogN)` . Ở đây sẽ dùng phương pháp khác.

### Phương pháp 1: Dùng hai heap

Duy trì hai heap, một max-heap và một min-heap. Số lớn nhất trong max-heap **nhỏ hơn hoặc bằng** số nhỏ nhất trong min-heap; bảo đảm chênh lệch số phần tử giữa hai heap không quá 1.

Nếu tổng số dữ liệu là **chẵn**, sau khi tạo hai heap, **trung vị là trung bình cộng của hai phần tử ở đỉnh heap**. Nếu tổng số dữ liệu là **lẻ**, tùy theo kích thước của hai heap, **trung vị chắc chắn nằm ở đỉnh heap chứa nhiều phần tử hơn**.

```java
class MedianFinder {

    private PriorityQueue<Integer> maxHeap;
    private PriorityQueue<Integer> minHeap;

    /** initialize your data structure here. */
    public MedianFinder() {
        maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        minHeap = new PriorityQueue<>(Integer::compareTo);
    }

    public void addNum(int num) {
        if (maxHeap.isEmpty() || maxHeap.peek() > num) {
            maxHeap.offer(num);
        } else {
            minHeap.offer(num);
        }

        int size1 = maxHeap.size();
        int size2 = minHeap.size();
        if (size1 - size2 > 1) {
            minHeap.offer(maxHeap.poll());
        } else if (size2 - size1 > 1) {
            maxHeap.offer(minHeap.poll());
        }
    }

    public double findMedian() {
        int size1 = maxHeap.size();
        int size2 = minHeap.size();

        return size1 == size2
            ? (maxHeap.peek() + minHeap.peek()) * 1.0 / 2
            : (size1 > size2 ? maxHeap.peek() : minHeap.peek());
    }
}
```

> Xem [LeetCode No.295](https://leetcode.com/problems/find-median-from-data-stream/)

Phương pháp trên cần tải tất cả dữ liệu vào bộ nhớ. Khi lượng dữ liệu lớn thì không thể làm như vậy, vì thế phương pháp này **phù hợp với trường hợp lượng dữ liệu nhỏ**. Với 500 triệu số, mỗi số chiếm 4B, tổng cộng cần 2G bộ nhớ. Nếu bộ nhớ khả dụng dưới 2G thì không thể dùng phương pháp này; dưới đây là một phương pháp khác.

### Phương pháp 2: Chia để trị

Ý tưởng của chia để trị là dần chuyển một bài toán lớn thành các bài toán nhỏ hơn để giải quyết.

Với bài toán này, lần lượt đọc 500 triệu số. Với mỗi số num được đọc, nếu bit cao nhất trong biểu diễn nhị phân của nó là 1 thì ghi số đó vào f1, nếu không thì ghi vào f0. Qua bước này có thể chia 500 triệu số thành hai phần; các số trong f0 đều lớn hơn các số trong f1 (bit cao nhất là bit dấu).

Sau khi chia, có thể dễ dàng xác định trung vị nằm trong f0 hay f1. Giả sử f1 có 100 triệu số, vậy trung vị chắc chắn nằm trong f0; đó là trung bình cộng của số thứ 150 triệu trong f0 khi sắp xếp tăng dần và số ngay sau nó.

> **Gợi ý**, trung vị của 500 triệu số là trung bình cộng của số thứ 250 triệu và số liền kề bên phải. Nếu f1 có 100 triệu số thì trung vị là trung bình cộng của hai số liên tiếp bắt đầu từ vị trí thứ 150 triệu trong f0.

Với f0, có thể tiếp tục dùng bit cao thứ hai trong biểu diễn nhị phân để chia tệp thành hai phần. Cứ tiếp tục chia như vậy cho đến khi tệp sau khi chia có thể được tải vào bộ nhớ; sau đó tải dữ liệu vào bộ nhớ, sắp xếp trực tiếp và tìm trung vị.

> **Lưu ý**, khi tổng số dữ liệu là số chẵn, nếu sau khi chia hai tệp có cùng số lượng dữ liệu thì trung vị là trung bình cộng của giá trị lớn nhất trong tệp chứa các số nhỏ hơn và giá trị nhỏ nhất trong tệp chứa các số lớn hơn.

## Tổng kết phương pháp

Chia để trị, đúng là quá hay!
