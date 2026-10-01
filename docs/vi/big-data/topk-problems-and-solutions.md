# Các khuôn mẫu thường dùng cho bài toán TopK trong dữ liệu lớn

Với lượng dữ liệu khổng lồ, thường gặp bài toán TopK. Khi thiết kế cấu trúc dữ liệu và thuật toán, điều cần xem xét chủ yếu là mức độ phù hợp của thuật toán hiện tại (bao gồm cấu trúc dữ liệu) với bối cảnh đã cho (chẳng hạn quy mô dữ liệu, kiểu dữ liệu), và nút thắt cốt lõi của bài toán hiện tại là gì (ví dụ cần giảm độ phức tạp thời gian hay độ phức tạp không gian).

Trước tiên, hãy xem một số ví dụ phổ biến về bài toán TopK:

1. Cho 100 số int, tìm 10 số lớn nhất;
1. Cho 1 tỷ số int, tìm 10 số lớn nhất (10 số này có thể không theo thứ tự);
1. Cho 1 tỷ số int, tìm 10 số lớn nhất (10 số này được sắp xếp theo thứ tự);
1. Cho 1 tỷ số int không trùng lặp, tìm 10 số lớn nhất;
1. Cho 10 mảng, mỗi mảng có 100 triệu số int, tìm 10 số lớn nhất;
1. Cho 1 tỷ số kiểu string, tìm 10 số lớn nhất (chỉ cần truy vấn một lần);
1. Cho 1 tỷ số kiểu string, tìm k số lớn nhất (cần truy vấn nhiều lần, trong đó k là một số ngẫu nhiên).

Những bài toán trên trông khá giống nhau, nhưng cách giải lại khác nhau rất nhiều. Chỉ cần sơ suất một chút, bài toán TopK có thể trở thành nút thắt của hệ thống. Tuy nhiên, cũng không cần quá lo: tiếp theo tôi sẽ tổng hợp một số hướng giải phổ biến. Khi gặp vấn đề, hãy kết hợp linh hoạt các ý tưởng nền tảng này để xử lý từng tình huống.
<br>

## 1. Phương pháp heap sort

Ở đây nói đến heap sort, không phải quick sort hay shell sort. Mặc dù độ phức tạp thời gian lý thuyết đều là `O(nlogn)`, nhưng heap sort có một ưu điểm khi giải TopK: có thể duy trì một heap min nhỏ chỉ chứa k số (hãy nghĩ kỹ xem vì sao là heap min). Khi số mới được thêm vào lớn hơn số ở đỉnh heap thì loại phần tử ở đỉnh và thêm số mới.

Để minh họa bằng C++, heap trong STL là priority_queue (không phải set).

```cpp
int main() {
    const int topK = 3;
    vector<int> vec = {4,1,5,8,7,2,3,0,6,9};
    priority_queue<int, vector<int>, greater<>> pq;    // 小顶堆
    for (const auto& x : vec) {
        pq.push(x);
        if (pq.size() > topK) {
            // 如果超出个数，则弹出堆顶（最小的）数据
            pq.pop();
        }
    }

    while (!pq.empty()) {
        cout << pq.top() << endl;    // 输出依次为7,8,9
        pq.pop();
    }

    return 0;
}
```

> Java cũng cung cấp cấu trúc dữ liệu PriorityQueue.

## 2. Phương pháp tương tự quick sort

Ai cũng biết quick sort; với bài toán TopK, có thể cải tiến quick sort và chỉ tính đệ quy trên một phần dữ liệu. Ví dụ, trong 100 số cần tìm 10 số lớn nhất; ở vòng lặp đầu tiên, pivot được đưa đến vị trí 80, khi đó chỉ cần tìm 10 số lớn nhất trong 20 số phía sau.

Ưu điểm của cách làm này là độ phức tạp thời gian tối ưu về lý thuyết có thể đạt `O(n)`, tuy nhiên độ phức tạp thời gian trung bình vẫn là `O(nlogn)`. Cần lưu ý rằng k số lớn nhất tìm được theo cách này không được sắp xếp theo thứ tự.

```cpp
int partition(vector<int>& arr, int begin, int end) {
    int left = begin;
    int right = end;
    int povit = arr[begin];

    while (left < right) {
        while (left < right && arr[right] >= povit) {right--;}
        while (left < right && arr[left] <= povit) {left++;}
        if (left < right) {swap(arr[left], arr[right]);}
    }

    swap(arr[begin], arr[left]);
    return left;
}

void partSort(vector<int>& arr, int begin, int end, int target) {
    if (begin >= end) {
        return;
    }

    int povit = partition(arr, begin, end);
    if (target < povit) {
        partSort(arr, begin, povit - 1, target);
    } else if (target > povit) {
        partSort(arr, povit + 1, end, target);
    }
}

vector<int> getMaxNumbers(vector<int>& arr, int k) {
    int size = (int)arr.size();
    // 把求最大的k个数，转换成求最小的size-k个数字
    int target = size - k;
    partSort(arr, 0, size - 1, target);
    vector<int> ret(arr.end() - k, arr.end());
    return ret;
}

int main() {
    vector<int> vec = {4,1,5,8,7,2,3,0,6,9};
    auto ret = getMaxNumbers(vec, 3);

    for (auto x : ret) {
        cout << x << endl;    // 输出7，8，9（理论上无序）
    }

    return 0;
}
```

<br>

## 3. Dùng bitmap

Đôi khi bài toán TopK có lượng dữ liệu quá lớn, không thể tải toàn bộ vào bộ nhớ. Khi đó, có thể cân nhắc lưu dữ liệu vào bitmap để tiện truy vấn.

Ví dụ, cho 10 dữ liệu kiểu int là 【13，12，11，1，2，3，4，5，6，7】; mỗi dữ liệu kiểu int chiếm 4 byte, vậy mảng này chiếm 40 byte. Bây giờ, đưa chúng vào bitmap gồm 16 giá trị bool, kết quả là 【0，1，1，1，1，1，1，1，0，0，0，1，1，1，0，0】. Cách này vừa giảm dung lượng sử dụng xuống còn 4 byte, vừa giúp dễ dàng nhận ra 3 số lớn nhất lần lượt là 11, 12 và 13.

Cần lưu ý rằng bitmap kết hợp với skip list thường mang lại hiệu quả bất ngờ. Chẳng hạn, dữ liệu trên cũng có thể được ghi lại như sau: bắt đầu từ bit thứ 1 có 7 bit 1 liên tiếp; bắt đầu từ bit thứ 11 có 3 bit 1 liên tiếp. Cách này tiếp tục giảm độ phức tạp không gian.

Ưu điểm của cách làm này dĩ nhiên là giảm độ phức tạp không gian. Tuy nhiên, cần lưu ý bitmap phù hợp hơn để truy vấn dữ liệu không trùng lặp và có phạm vi (chẳng hạn dữ liệu đều nằm trong khoảng 0 ～ 1 tỷ). Với dữ liệu trùng lặp, có thể cân nhắc kết hợp bitmap với hash hoặc cấu trúc khác.
<br>

## 4. Dùng hash

Nếu cần truy vấn thứ tự của dữ liệu kiểu string, có thể cân nhắc phương pháp hash.

Ví dụ, với 10 số dạng string 【"1001"，"23"，"1002"，"3003"，"2001"，"1111"，"65"，"834"，"5"，"987"】, hãy tìm 3 số lớn nhất. Trước hết, hash theo độ dài và nhận thấy độ dài lớn nhất là 4, có 5 string dài 4 ký tự. Tiếp theo, hash theo chữ số đầu tiên: có 1 string bắt đầu bằng "3", 1 string bắt đầu bằng "2" và 3 string bắt đầu bằng "1". Sau đó, bằng cách thiết kế thêm hàm hash hoặc lặp qua 3 string có chữ số đầu tiên là "1", tìm string lớn nhất trong số đó để xác định 3 giá trị lớn nhất.

Phương pháp này khá phù hợp cho việc truy vấn URL hoặc số điện thoại. Nhược điểm là nếu cần truy vấn nhiều lần thì phải tính hash nhiều lần, đồng thời cần thiết kế nhiều hàm hash tùy tình huống thực tế.
<br>

## 5. Cây từ điển

Cấu trúc cụ thể và cách truy vấn cây từ điển (trie) sẽ không trình bày ở đây; có thể tự tìm trên Baidu. Phần này chủ yếu nói về ưu điểm và nhược điểm.

![](../../big-data/images/topk-trie.png)

Ý tưởng của cây từ điển là xây dựng thông tin chỉ mục từ trước để có thể truy vấn lặp lại nhiều lần về sau; việc thêm và xóa dữ liệu sau đó cũng rất thuận tiện. Cấu trúc này phù hợp với trường hợp cần truy vấn lặp lại nhiều lần.

Ví dụ, khi cần truy vấn nhiều lần k URL có thứ tự ký tự lớn nhất (chẳng hạn z>y>...>b>a), dùng cây từ điển để lưu dữ liệu là rất phù hợp. Cách này vừa giảm độ phức tạp không gian, vừa tăng tốc độ truy vấn.
<br>

## 6. Truy vấn kết hợp

Các phương pháp trên tương đối độc lập. Trên thực tế, những bài toán thường gặp hơn là bài toán kết hợp; vì vậy cần kết hợp linh hoạt các kiến thức liên quan và áp dụng chúng một cách phù hợp.

Tôi lấy ví dụ: dịch vụ phân tán của chúng ta chạy trên 10 máy khác nhau; dịch vụ trên mỗi máy nhận 10000 yêu cầu và ghi lại thời gian xử lý của 10000 yêu cầu này (giá trị thời gian là dữ liệu int). Hãy tìm 50 thời gian xử lý lớn nhất trong 10\*10000 yêu cầu, sắp xếp từ cao xuống thấp. Bài toán này khá thực tế, đúng không? Hãy thử kết hợp các phương pháp đã giới thiệu để giải.

### Phương pháp 1

Trước tiên, áp dụng cách tương tự quick sort cho 10000 giá trị trên mỗi máy để tìm 50 thời gian xử lý lớn nhất trên từng máy. Lúc này, 50 giá trị trên một máy chưa được sắp xếp.

Sau đó, gộp 50 giá trị trên 10 máy (tổng cộng 500 giá trị) rồi áp dụng thêm một lần cách tương tự quick sort để tìm 50 giá trị lớn nhất (lúc này 50 giá trị này vẫn chưa được sắp xếp).

Cuối cùng, quick sort 50 giá trị này để có kết quả cuối cùng.

### Phương pháp 2

Trước tiên, lần lượt dùng heap sort để tìm 50 giá trị có thời gian xử lý cao nhất trên 10 máy; lúc này 50 giá trị đã được sắp xếp từ lớn xuống nhỏ.

Sau đó, lần lượt lấy 5 giá trị có thời gian xử lý cao nhất từ mỗi máy trong 10 máy và đưa vào heap min.

Cuối cùng, duyệt dữ liệu trên 10 máy. Với mỗi máy, bắt đầu từ giá trị thứ 6 và duyệt tiếp; nếu giá trị này lớn hơn giá trị ở đỉnh heap thì loại giá trị ở đỉnh heap và thêm giá trị mới vào, sau đó tiếp tục so sánh tương tự với giá trị kế tiếp. Nếu giá trị này nhỏ hơn giá trị ở đỉnh heap thì kết thúc vòng lặp hiện tại và thực hiện thao tác tương tự trên máy tiếp theo.

Tôi giới thiệu hai phương pháp không phải để nói phương pháp nào tốt hơn hoặc có độ phức tạp thời gian thấp hơn. Điều muốn nói là cùng một việc có nhiều cách giải quyết khác nhau; khi lượng dữ liệu tăng lên, có thể cần thêm nhiều cách kết hợp. Trong lĩnh vực này, dữ liệu quyết định cấu trúc dữ liệu, cấu trúc dữ liệu quyết định thuật toán.

**Không có phương pháp tốt nhất; chỉ có những lập trình viên không ngừng tìm kiếm phương pháp tốt hơn. Phương pháp phù hợp mới là phương pháp tốt nhất.**

Ừm, cố lên, bạn có thể tìm ra phương pháp tốt hơn!!!
